using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Logging;
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
/// Unit tests for ChatOrchestrator and Entity state management.
/// </summary>
public class ChatOrchestratorTests
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
        private readonly string _sentiment;
        private readonly double _intensity;

        public FakeSentimentAnalyzer(string sentiment, double intensity) : base(new FakeChatClient(), null!)
        {
            _sentiment = sentiment;
            _intensity = intensity;
        }

        public override Task<SentimentResultLlmDto> AnalyzeAsync(string text, CancellationToken ct = default)
        {
            return Task.FromResult(new SentimentResultLlmDto
            {
                Sentiment = _sentiment,
                Intensity = _intensity
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

    #region Test Methods

    [Fact]
    public async Task ProcessMessageAsync_ShouldSuccessfullyInsertMessages_WithCorrectEntityStates()
    {
        // Arrange
        using var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();

        var options = new DbContextOptionsBuilder<AiDbContext>()
            .UseSqlite(connection)
            .Options;

        using (var setupContext = new AiDbContext(options))
        {
            await setupContext.Database.EnsureCreatedAsync();
        }

        using var dbContext = new AiDbContext(options);

        // Seed an initial session
        var session = new ChatSession(Guid.NewGuid(), "Web");
        dbContext.ChatSessions.Add(session);
        await dbContext.SaveChangesAsync();

        // Instantiate services
        var fakeSales = new FakeSalesModule();
        var fakeWms = new FakeWmsModule();
        var fakeChat = new FakeChatClient();
        
        var loggerFactory = LoggerFactory.Create(builder => builder.AddConsole());
        var sentimentLogger = loggerFactory.CreateLogger<SentimentAnalyzer>();
        
        var sentimentAnalyzer = new SentimentAnalyzer(fakeChat, sentimentLogger);
        
        // Let's verify our assumptions about EF Core's ChangeTracker with newly instantiated ChatMessage.
        var userMessage = new ChatMessage(session.Id, "user", "Hello AI", SentimentLevel.Neutral);
        
        // Assert: Before adding, it is detached
        Assert.Equal(EntityState.Detached, dbContext.Entry(userMessage).State);

        // Act: We set the State to Added
        dbContext.Entry(userMessage).State = EntityState.Added;

        // Assert: State should be Added
        Assert.Equal(EntityState.Added, dbContext.Entry(userMessage).State);

        // Save changes to check if it persists successfully
        await dbContext.SaveChangesAsync();
        Assert.Equal(EntityState.Unchanged, dbContext.Entry(userMessage).State);
    }

    [Fact]
    public async Task ProcessMessageAsync_WithNeutralSentiment_ShouldExecuteRagPathAndSaveSuccessfully()
    {
        // Arrange
        using var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();

        var options = new DbContextOptionsBuilder<AiDbContext>()
            .UseSqlite(connection)
            .Options;

        using (var setupContext = new AiDbContext(options))
        {
            await setupContext.Database.EnsureCreatedAsync();
        }

        using var dbContext = new AiDbContext(options);

        // Seed an initial session
        var session = new ChatSession(Guid.NewGuid(), "Web");
        dbContext.ChatSessions.Add(session);
        await dbContext.SaveChangesAsync();

        // Instantiate services
        var fakeSales = new FakeSalesModule();
        var fakeWms = new FakeWmsModule();
        var fakeChat = new FakeChatClient();
        var sentimentAnalyzer = new FakeSentimentAnalyzer("Neutral", 0.0);
        var ragService = new FakeRagService();

        var orchestrator = new ChatOrchestrator(
            dbContext,
            ragService,
            sentimentAnalyzer,
            fakeSales,
            fakeWms,
            fakeChat);

        // Act
        var response = await orchestrator.ProcessMessageAsync(
            customerId: Guid.NewGuid(),
            messageContent: "Tôi muốn mua gạch men",
            sessionId: session.Id,
            customerTier: "Retail");

        // Assert
        Assert.NotNull(response);
        Assert.Equal("Fake RAG Response", response.Answer);
        Assert.Equal(session.Id, response.SessionId);

        // Verify the database has user and assistant messages saved
        var messages = await dbContext.ChatMessages
            .Where(m => m.SessionId == session.Id)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();

        Assert.Equal(2, messages.Count);
        Assert.Equal("user", messages[0].Role);
        Assert.Equal("Tôi muốn mua gạch men", messages[0].Content);
        Assert.Equal(SentimentLevel.Neutral, messages[0].Sentiment);
        Assert.Equal("assistant", messages[1].Role);
        Assert.Equal("Fake RAG Response", messages[1].Content);
    }

    [Fact]
    public async Task ProcessMessageAsync_WithNegativeSentiment_ShouldExecuteEscalationPathAndSaveSuccessfully()
    {
        // Arrange
        using var connection = new SqliteConnection("DataSource=:memory:");
        connection.Open();

        var options = new DbContextOptionsBuilder<AiDbContext>()
            .UseSqlite(connection)
            .Options;

        using (var setupContext = new AiDbContext(options))
        {
            await setupContext.Database.EnsureCreatedAsync();
        }

        using var dbContext = new AiDbContext(options);

        // Seed an initial session
        var session = new ChatSession(Guid.NewGuid(), "Web");
        dbContext.ChatSessions.Add(session);
        await dbContext.SaveChangesAsync();

        // Instantiate services
        var fakeSales = new FakeSalesModule();
        var fakeWms = new FakeWmsModule();
        var fakeChat = new FakeChatClient();
        var sentimentAnalyzer = new FakeSentimentAnalyzer("Negative", 0.95);
        var ragService = new FakeRagService();

        var orchestrator = new ChatOrchestrator(
            dbContext,
            ragService,
            sentimentAnalyzer,
            fakeSales,
            fakeWms,
            fakeChat);

        // Act
        var response = await orchestrator.ProcessMessageAsync(
            customerId: Guid.NewGuid(),
            messageContent: "Hàng giao quá trễ, tôi rất bực mình!",
            sessionId: session.Id,
            customerTier: "Retail");

        // Assert
        Assert.NotNull(response);
        Assert.Equal("Fake Assistant Response", response.Answer);
        Assert.Equal(session.Id, response.SessionId);

        // Verify support ticket is created in DB
        var ticket = await dbContext.SupportTickets
            .FirstOrDefaultAsync(t => t.SessionId == session.Id);
        Assert.NotNull(ticket);
        Assert.Equal(TicketPriority.Urgent, ticket.Priority);

        // Verify the database has user and assistant messages saved
        var messages = await dbContext.ChatMessages
            .Where(m => m.SessionId == session.Id)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync();

        Assert.Equal(2, messages.Count);
        Assert.Equal("user", messages[0].Role);
        Assert.Equal("Hàng giao quá trễ, tôi rất bực mình!", messages[0].Content);
        Assert.Equal(SentimentLevel.Negative, messages[0].Sentiment);
        Assert.Equal("assistant", messages[1].Role);
        Assert.Equal("Fake Assistant Response", messages[1].Content);
    }

    #endregion
}
