using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Logging;
using VLXD.Modules.AI.Api;
using VLXD.Modules.AI.Application.Services;
using VLXD.Modules.AI.Domain.Entities;
using VLXD.Modules.AI.Domain.Enums;
using VLXD.Modules.AI.Infrastructure;
using VLXD.SharedKernel.Application.Contracts;
using Xunit;
using ChatMessage = VLXD.Modules.AI.Domain.Entities.ChatMessage;
using LlmChatMessage = Microsoft.Extensions.AI.ChatMessage;

namespace VLXD.Modules.AI.Tests;

/// <summary>
/// Integration tests verifying endpoint handlers behavior within the AI module.
/// </summary>
public class AiEndpointsTests
{
    #region Test Classes / Fakes

    private class FakeSalesModule : ISalesModule
    {
        public Task<Guid?> GetCustomerIdByUserIdAsync(Guid userId) => Task.FromResult<Guid?>(Guid.NewGuid());
        public Task<Guid?> GetLastOrderIdByCustomerAsync(Guid customerId) => Task.FromResult<Guid?>(Guid.NewGuid());
        public Task<Guid> CreateQuotationDraftAsync(Guid customerId, string sourceText, List<QuotationItemContractDto> items) => Task.FromResult(Guid.NewGuid());
    }

    private class FakeWmsModule : IWmsModule
    {
        public Task<int> GetLowStockCountAsync() => Task.FromResult(0);
        public Task<string> GetDeliveryStatusAsync(Guid orderId) => Task.FromResult("Delivered");
        public Task<bool> CheckStockAsync(Guid productId, decimal quantity) => Task.FromResult(true);
    }

    private class FakeChatClient : IChatClient
    {
        public ChatClientMetadata Metadata => new ChatClientMetadata("FakeModel");

        public void Dispose() { }

        public Task<ChatCompletion> CompleteAsync(IList<LlmChatMessage> chatMessages, ChatOptions? options = null, CancellationToken cancellationToken = default)
        {
            var message = new LlmChatMessage(ChatRole.Assistant, "Fake Assistant Response");
            return Task.FromResult(new ChatCompletion(message));
        }

        public IAsyncEnumerable<StreamingChatCompletionUpdate> CompleteStreamingAsync(IList<LlmChatMessage> chatMessages, ChatOptions? options = null, CancellationToken cancellationToken = default)
        {
            return AsyncEnumerable.Empty<StreamingChatCompletionUpdate>();
        }

        public object? GetService(Type serviceType, object? serviceKey = null) => null;
    }

    private class FakeSentimentAnalyzer : SentimentAnalyzer
    {
        public FakeSentimentAnalyzer() : base(new FakeChatClient(), null!) { }

        public override Task<SentimentResultLlmDto> AnalyzeAsync(string text, CancellationToken ct = default)
        {
            return Task.FromResult(new SentimentResultLlmDto
            {
                Sentiment = "Neutral",
                Intensity = 0.0
            });
        }
    }

    private class FakeRagService : RagService
    {
        public FakeRagService() : base(null!, new FakeChatClient(), null!) { }

        public override Task<RagResponse> AskAsync(
            string question, 
            List<LlmChatMessage> chatHistory, 
            string customerTier = "Retail", 
            CancellationToken ct = default)
        {
            return Task.FromResult(new RagResponse("Fake RAG Response", new List<ProductContractDto>()));
        }
    }

    #endregion

    #region Helpers

    private async Task<AiDbContext> CreateDbContextAsync()
    {
        var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();

        var options = new DbContextOptionsBuilder<AiDbContext>()
            .UseSqlite(connection)
            .Options;

        var context = new AiDbContext(options);
        await context.Database.EnsureCreatedAsync();
        return context;
    }

    #endregion

    #region Endpoint Test Methods

    [Fact]
    public async Task ProcessChatAsync_ShouldReturnOk_WithChatOrchestratorResponse()
    {
        // Arrange
        using var dbContext = await CreateDbContextAsync();
        var fakeSales = new FakeSalesModule();
        var fakeWms = new FakeWmsModule();
        var fakeChat = new FakeChatClient();
        var sentimentAnalyzer = new FakeSentimentAnalyzer();
        var ragService = new FakeRagService();

        var orchestrator = new ChatOrchestrator(
            dbContext,
            ragService,
            sentimentAnalyzer,
            fakeSales,
            fakeWms,
            fakeChat);

        // Seed session
        var session = new ChatSession(Guid.NewGuid(), "Web");
        dbContext.ChatSessions.Add(session);
        await dbContext.SaveChangesAsync();

        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
            new Claim("customer_tier", "Retail")
        }, "TestAuth"));

        var request = new ChatRequest("Chào trợ lý", session.Id);

        // Act
        var result = await AiEndpoints.ProcessChatAsync(
            orchestrator,
            fakeSales,
            user,
            request,
            CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<Ok<ChatOrchestratorResponse>>(result);
        Assert.NotNull(okResult.Value);
        Assert.Equal("Fake RAG Response", okResult.Value.Answer);
        Assert.Equal(session.Id, okResult.Value.SessionId);
    }

    [Fact]
    public async Task GetSessionsAsync_ForAdmin_ShouldReturnAllSessions()
    {
        // Arrange
        using var dbContext = await CreateDbContextAsync();
        var fakeSales = new FakeSalesModule();

        // Seed sessions
        var s1 = new ChatSession(Guid.NewGuid(), "Web");
        var s2 = new ChatSession(Guid.NewGuid(), "Web");
        dbContext.ChatSessions.AddRange(s1, s2);
        await dbContext.SaveChangesAsync();

        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Role, "Admin")
        }, "TestAuth"));

        // Act
        var result = await AiEndpoints.GetSessionsAsync(
            dbContext,
            fakeSales,
            user,
            CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<Ok<List<ChatSession>>>(result);
        Assert.NotNull(okResult.Value);
        Assert.Equal(2, okResult.Value.Count);
    }

    [Fact]
    public async Task GetSessionMessagesAsync_WithCorrectAccess_ShouldReturnMessages()
    {
        // Arrange
        using var dbContext = await CreateDbContextAsync();
        var fakeSales = new FakeSalesModule();

        // Seed session & messages
        var session = new ChatSession(Guid.NewGuid(), "Web");
        dbContext.ChatSessions.Add(session);
        await dbContext.SaveChangesAsync();

        var m1 = new ChatMessage(session.Id, "user", "Message 1", SentimentLevel.Neutral);
        dbContext.ChatMessages.Add(m1);
        await dbContext.SaveChangesAsync();

        await Task.Delay(20); // distinct timestamp for audit

        var m2 = new ChatMessage(session.Id, "assistant", "Message 2");
        dbContext.ChatMessages.Add(m2);
        await dbContext.SaveChangesAsync();

        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Role, "Admin")
        }, "TestAuth"));

        // Act
        var result = await AiEndpoints.GetSessionMessagesAsync(
            dbContext,
            fakeSales,
            user,
            session.Id,
            CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<Ok<List<ChatMessage>>>(result);
        Assert.NotNull(okResult.Value);
        Assert.Equal(2, okResult.Value.Count);
        Assert.Equal("Message 1", okResult.Value[0].Content);
        Assert.Equal("Message 2", okResult.Value[1].Content);
    }

    [Fact]
    public async Task GetSessionMessagesAsync_WithGuestSession_ShouldAssociateCustomerAndSave()
    {
        // Arrange
        using var dbContext = await CreateDbContextAsync();
        
        var customerId = Guid.NewGuid();
        var fakeSales = new ConfigurableSalesModule { CustomerIdToReturn = customerId };

        // Seed session with null CustomerId
        var session = new ChatSession(null, "Web");
        dbContext.ChatSessions.Add(session);
        await dbContext.SaveChangesAsync();

        var userId = Guid.NewGuid();
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString())
        }, "TestAuth")); // No Admin/Employee role, just a regular customer

        // Act
        var result = await AiEndpoints.GetSessionMessagesAsync(
            dbContext,
            fakeSales,
            user,
            session.Id,
            CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<Ok<List<ChatMessage>>>(result);
        
        // Verify customer ID was updated and saved in DB
        var updatedSession = await dbContext.ChatSessions.FindAsync(session.Id);
        Assert.NotNull(updatedSession);
        Assert.Equal(customerId, updatedSession.CustomerId);
    }

    private class ConfigurableSalesModule : ISalesModule
    {
        public Guid? CustomerIdToReturn { get; set; }
        public Task<Guid?> GetCustomerIdByUserIdAsync(Guid userId) => Task.FromResult(CustomerIdToReturn);
        public Task<Guid?> GetLastOrderIdByCustomerAsync(Guid customerId) => Task.FromResult<Guid?>(Guid.NewGuid());
        public Task<Guid> CreateQuotationDraftAsync(Guid customerId, string sourceText, List<QuotationItemContractDto> items) => Task.FromResult(Guid.NewGuid());
    }

    [Fact]
    public async Task GetTicketsAsync_ShouldReturnAllSupportTickets()
    {
        // Arrange
        using var dbContext = await CreateDbContextAsync();

        // Seed session first to satisfy foreign key constraints
        var session = new ChatSession(Guid.NewGuid(), "Web");
        dbContext.ChatSessions.Add(session);
        await dbContext.SaveChangesAsync();

        // Seed support tickets
        var ticket1 = new SupportTicket(session.Id, Guid.NewGuid(), TicketPriority.High, "Vấn đề vận chuyển");
        var ticket2 = new SupportTicket(session.Id, Guid.NewGuid(), TicketPriority.Low, "Vấn đề sản phẩm");
        dbContext.SupportTickets.AddRange(ticket1, ticket2);
        await dbContext.SaveChangesAsync();

        // Act
        var result = await AiEndpoints.GetTicketsAsync(dbContext, CancellationToken.None);

        // Assert
        var okResult = Assert.IsType<Ok<List<SupportTicket>>>(result);
        Assert.NotNull(okResult.Value);
        Assert.Equal(2, okResult.Value.Count);
    }

    #endregion
}
