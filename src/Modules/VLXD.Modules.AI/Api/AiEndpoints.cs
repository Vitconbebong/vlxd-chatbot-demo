using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using VLXD.Modules.AI.Application.Services;
using VLXD.Modules.AI.Domain.Entities;
using VLXD.Modules.AI.Domain.Enums;
using VLXD.Modules.AI.Infrastructure;
using VLXD.SharedKernel.Application.Contracts;

namespace VLXD.Modules.AI.Api;

#region Request DTOs

/// <summary>
/// Payload containing message content for conversational AI queries.
/// </summary>
public record ChatRequest(string Message, Guid? SessionId);

/// <summary>
/// Payload containing raw quotation text to parse.
/// </summary>
public record ExtractQuotationRequest(string RawText);

/// <summary>
/// Payload containing status and assignment updates for support tickets.
/// </summary>
public record UpdateTicketRequest(string Status, Guid? AssignedTo);

#endregion

/// <summary>
/// Exposes AI module REST endpoints via Minimal APIs.
/// </summary>
public static class AiEndpoints
{
    #region Methods

    /// <summary>
    /// Maps AI endpoints to the main routing table.
    /// </summary>
    public static IEndpointRouteBuilder MapAiEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/ai").WithTags("AI");

        // Chat flow endpoints
        group.MapPost("/chat", ProcessChatAsync);
        group.MapGet("/chat/sessions", GetSessionsAsync).RequireAuthorization();
        group.MapGet("/chat/sessions/{id:guid}/messages", GetSessionMessagesAsync).RequireAuthorization();

        // Quotation extraction endpoints
        group.MapPost("/extract-quotation", ExtractQuotationAsync).RequireAuthorization();

        // Support ticket operations
        group.MapGet("/tickets", GetTicketsAsync)
            .RequireAuthorization(policy => policy.RequireRole("Admin", "Employee"));
            
        group.MapPut("/tickets/{id:guid}", UpdateTicketAsync)
            .RequireAuthorization(policy => policy.RequireRole("Admin", "Employee"));

        // Embeddings management
        group.MapPost("/embeddings/rebuild", RebuildEmbeddingsAsync)
            .RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapDelete("/chat/sessions/{id:guid}", DeleteSessionAsync)
            .RequireAuthorization(policy => policy.RequireRole("Admin"));
            
        group.MapDelete("/chat/sessions/{sessionId:guid}/messages/{messageId:guid}", DeleteMessageAsync)
            .RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapDelete("/embeddings", ClearEmbeddingsAsync)
            .RequireAuthorization(policy => policy.RequireRole("Admin"));

        return endpoints;
    }

    #region Endpoint Handlers

    /// <summary>
    /// Processes incoming user chat request.
    /// </summary>
    public static async Task<IResult> ProcessChatAsync(
        [FromServices] ChatOrchestrator orchestrator,
        [FromServices] ISalesModule salesModule,
        ClaimsPrincipal user,
        [FromBody] ChatRequest request,
        CancellationToken ct)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Message))
        {
            return Results.BadRequest(new { Message = "Message content cannot be empty." });
        }

        Guid? customerId = null;
        string customerTier = "Retail";
        

        // Resolve customer details if authenticated
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out var userId))
        {
            var resolvedCustomerId = await salesModule.GetCustomerIdByUserIdAsync(userId);
            if (resolvedCustomerId.HasValue)
            {
                customerId = resolvedCustomerId.Value;
            }

            var tierClaim = user.FindFirst("customer_tier")?.Value;
            if (!string.IsNullOrEmpty(tierClaim))
            {
                customerTier = tierClaim;
            }
        }

        var response = await orchestrator.ProcessMessageAsync(
            customerId, 
            request.Message, 
            request.SessionId, 
            customerTier, 
            ct);

        return Results.Ok(response);
    }

    /// <summary>
    /// Retrieves historical chat sessions list.
    /// </summary>
    public static async Task<IResult> GetSessionsAsync(
        [FromServices] AiDbContext dbContext,
        [FromServices] ISalesModule salesModule,
        ClaimsPrincipal user,
        CancellationToken ct)
    {
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Results.Unauthorized();
        }

        // Admin and staff get all conversations
        if (user.IsInRole("Admin") || user.IsInRole("Employee"))
        {
            var allSessions = await dbContext.ChatSessions
                .OrderByDescending(s => s.LastMessageAt)
                .ToListAsync(ct);
            return Results.Ok(allSessions);
        }

        // Customers only get their own conversations
        var customerId = await salesModule.GetCustomerIdByUserIdAsync(userId);
        if (!customerId.HasValue)
        {
            return Results.Ok(new List<ChatSession>());
        }

        var customerSessions = await dbContext.ChatSessions
            .Where(s => s.CustomerId == customerId.Value)
            .OrderByDescending(s => s.LastMessageAt)
            .ToListAsync(ct);

        return Results.Ok(customerSessions);
    }

    /// <summary>
    /// Fetches messages for a specific chat session.
    /// </summary>
    public static async Task<IResult> GetSessionMessagesAsync(
        [FromServices] AiDbContext dbContext,
        [FromServices] ISalesModule salesModule,
        ClaimsPrincipal user,
        [FromRoute] Guid id,
        CancellationToken ct)
    {
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Results.Unauthorized();
        }

        var session = await dbContext.ChatSessions
            .FirstOrDefaultAsync(s => s.Id == id, ct);

        if (session == null)
        {
            return Results.NotFound(new { Message = "Chat session not found." });
        }

        // Validate access rights
        if (!user.IsInRole("Admin") && !user.IsInRole("Employee"))
        {
            var customerId = await salesModule.GetCustomerIdByUserIdAsync(userId);
            if (!customerId.HasValue)
            {
                return Results.Forbid();
            }

            if (session.CustomerId == null)
            {
                session.AssociateCustomer(customerId.Value);
                await dbContext.SaveChangesAsync(ct);
            }
            else if (session.CustomerId != customerId.Value)
            {
                return Results.Forbid();
            }
        }

        var messages = await dbContext.ChatMessages
            .Where(m => m.SessionId == id)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync(ct);

        return Results.Ok(messages);
    }

    /// <summary>
    /// Extracts products and quantities from messy requests, creating a sales quotation draft.
    /// </summary>
    public static async Task<IResult> ExtractQuotationAsync(
        [FromServices] EntityExtractionService extractor,
        [FromServices] ISalesModule salesModule,
        ClaimsPrincipal user,
        [FromBody] ExtractQuotationRequest request,
        CancellationToken ct)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.RawText))
        {
            return Results.BadRequest(new { Message = "Raw request text cannot be empty." });
        }

        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Results.Unauthorized();
        }

        var customerId = await salesModule.GetCustomerIdByUserIdAsync(userId);
        if (!customerId.HasValue)
        {
            return Results.BadRequest(new { Message = "Sales customer profile not found for this user account." });
        }

        string customerTier = user.FindFirst("customer_tier")?.Value ?? "Retail";

        var quotationId = await extractor.ExtractAndCreateQuotationAsync(
            request.RawText, 
            customerId.Value, 
            customerTier, 
            ct);

        return Results.Ok(new { QuotationId = quotationId });
    }

    /// <summary>
    /// Retrieves support tickets escalated from frustrated chats.
    /// </summary>
    public static async Task<IResult> GetTicketsAsync(
        [FromServices] AiDbContext dbContext,
        CancellationToken ct)
    {
        var tickets = await dbContext.SupportTickets
            .OrderByDescending(t => t.Priority)
            .ThenByDescending(t => t.CreatedAt)
            .ToListAsync(ct);

        return Results.Ok(tickets);
    }

    /// <summary>
    /// Updates status and assigned developer for support tickets.
    /// </summary>
    public static async Task<IResult> UpdateTicketAsync(
        [FromServices] AiDbContext dbContext,
        [FromRoute] Guid id,
        [FromBody] UpdateTicketRequest request,
        CancellationToken ct)
    {
        if (request == null)
        {
            return Results.BadRequest(new { Message = "Request updates cannot be empty." });
        }

        var ticket = await dbContext.SupportTickets
            .FirstOrDefaultAsync(t => t.Id == id, ct);

        if (ticket == null)
        {
            return Results.NotFound(new { Message = "Support ticket not found." });
        }

        if (request.AssignedTo.HasValue)
        {
            ticket.Assign(request.AssignedTo.Value);
        }

        if (!string.IsNullOrEmpty(request.Status))
        {
            switch (request.Status.ToLower())
            {
                case "resolved":
                    ticket.Resolve();
                    break;
                case "closed":
                    ticket.Close();
                    break;
            }
        }

        await dbContext.SaveChangesAsync(ct);
        return Results.Ok(ticket);
    }

    /// <summary>
    /// Triggers vector generation processes for all catalog products in batch.
    /// </summary>
    private static async Task<IResult> RebuildEmbeddingsAsync(
        [FromServices] EmbeddingService embeddingService,
        CancellationToken ct)
    {
        await embeddingService.EmbedAllProductsAsync(ct);
        return Results.Ok(new { Message = "Embeddings rebuild completed successfully." });
    }

    /// <summary>
    /// Deletes a specific chat session and all its messages.
    /// </summary>
    private static async Task<IResult> DeleteSessionAsync(
        [FromServices] AiDbContext dbContext,
        [FromRoute] Guid id,
        CancellationToken ct)
    {
        var session = await dbContext.ChatSessions
            .Include(s => s.Messages)
            .FirstOrDefaultAsync(s => s.Id == id, ct);

        if (session == null)
        {
            return Results.NotFound(new { Message = "Chat session not found." });
        }

        // Remove support tickets referencing this session first to prevent constraint errors
        var tickets = await dbContext.SupportTickets
            .Where(t => t.SessionId == id)
            .ToListAsync(ct);
        dbContext.SupportTickets.RemoveRange(tickets);

        dbContext.ChatMessages.RemoveRange(session.Messages);
        dbContext.ChatSessions.Remove(session);

        await dbContext.SaveChangesAsync(ct);
        return Results.Ok(new { Success = true, Message = "Session deleted successfully." });
    }

    /// <summary>
    /// Deletes a specific message inside a session.
    /// </summary>
    private static async Task<IResult> DeleteMessageAsync(
        [FromServices] AiDbContext dbContext,
        [FromRoute] Guid sessionId,
        [FromRoute] Guid messageId,
        CancellationToken ct)
    {
        var message = await dbContext.ChatMessages
            .FirstOrDefaultAsync(m => m.SessionId == sessionId && m.Id == messageId, ct);

        if (message == null)
        {
            return Results.NotFound(new { Message = "Message not found." });
        }

        dbContext.ChatMessages.Remove(message);
        await dbContext.SaveChangesAsync(ct);
        return Results.Ok(new { Success = true, Message = "Message deleted successfully." });
    }

    /// <summary>
    /// Clears all product vector embeddings from memory/database.
    /// </summary>
    private static async Task<IResult> ClearEmbeddingsAsync(
        [FromServices] AiDbContext dbContext,
        [FromServices] VectorSearchService vectorSearchService,
        CancellationToken ct)
    {
        var embeddings = await dbContext.ProductEmbeddings.ToListAsync(ct);
        dbContext.ProductEmbeddings.RemoveRange(embeddings);
        
        await dbContext.SaveChangesAsync(ct);
        vectorSearchService.InvalidateCache();

        return Results.Ok(new { Success = true, Message = "AI memory cleared successfully." });
    }

    #endregion

    #endregion
}
