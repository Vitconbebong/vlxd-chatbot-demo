using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.AI;
using VLXD.Modules.AI.Domain.Entities;
using VLXD.Modules.AI.Domain.Enums;
using VLXD.Modules.AI.Infrastructure;
using VLXD.SharedKernel.Application.Contracts;
using LlmChatMessage = Microsoft.Extensions.AI.ChatMessage;
using ChatMessage = VLXD.Modules.AI.Domain.Entities.ChatMessage;

namespace VLXD.Modules.AI.Application.Services;

/// <summary>
/// Response model returned by the chat processing system.
/// </summary>
public record ChatOrchestratorResponse(
    string Answer, 
    Guid SessionId, 
    List<ProductContractDto> MatchedProducts,
    string SentimentLevel = "Neutral",
    double SentimentIntensity = 0.0
);

/// <summary>
/// Orchestrates user chats, sentiment analysis, delivery lookup, ticket escalation, and RAG consulting pipelines.
/// </summary>
public class ChatOrchestrator
{
    #region Fields

    private readonly AiDbContext _dbContext;
    private readonly RagService _ragService;
    private readonly SentimentAnalyzer _sentimentAnalyzer;
    private readonly ISalesModule _salesModule;
    private readonly IWmsModule _wmsModule;
    private readonly IChatClient _chatClient;

    #endregion

    #region Constructors

    /// <summary>
    /// Initializes a new instance of the ChatOrchestrator class.
    /// </summary>
    public ChatOrchestrator(
        AiDbContext dbContext,
        RagService ragService,
        SentimentAnalyzer sentimentAnalyzer,
        ISalesModule salesModule,
        IWmsModule wmsModule,
        IChatClient chatClient)
    {
        _dbContext = dbContext;
        _ragService = ragService;
        _sentimentAnalyzer = sentimentAnalyzer;
        _salesModule = salesModule;
        _wmsModule = wmsModule;
        _chatClient = chatClient;
    }

    #endregion

    #region Methods

    /// <summary>
    /// Processes incoming chat messages, runs sentiment evaluation, performs conditional ticket routing, and queries RAG models.
    /// </summary>
    public async Task<ChatOrchestratorResponse> ProcessMessageAsync(
        Guid? customerId,
        string messageContent,
        Guid? sessionId = null,
        string customerTier = "Retail",
        CancellationToken ct = default)
    {
        // 1. Retrieve or create the active ChatSession
        ChatSession? session = null;
        if (sessionId.HasValue && sessionId.Value != Guid.Empty)
        {
            session = await _dbContext.ChatSessions
                .Include(x => x.Messages)
                .FirstOrDefaultAsync(x => x.Id == sessionId.Value, ct);

            if (session != null && customerId.HasValue && !session.CustomerId.HasValue)
            {
                session.AssociateCustomer(customerId.Value);
            }
        }

        if (session == null)
        {
            session = new ChatSession(customerId, "Web");
            _dbContext.ChatSessions.Add(session);
        }

        // 2. Perform sentiment analysis on the incoming message
        var sentimentResult = await _sentimentAnalyzer.AnalyzeAsync(messageContent, ct);
        
        // Parse sentiment level matching the DB enum structure
        Enum.TryParse<SentimentLevel>(sentimentResult.Sentiment, out var mappedSentiment);

        // 3. Persist the user's message with sentiment tags in database
        var userMessage = new ChatMessage(session.Id, "user", messageContent, mappedSentiment);
        session.AddMessage(userMessage);
        _dbContext.ChatMessages.Add(userMessage);

        // 4. Determine execution path based on emotional intensity
        if (mappedSentiment == SentimentLevel.Negative)
        {
            // ROUTE A: Escalation Flow (Angry customer)
            
            // Check for delivery information if possible
            string? deliveryStatusInfo = null;
            if (customerId.HasValue)
            {
                var lastOrderId = await _salesModule.GetLastOrderIdByCustomerAsync(customerId.Value);
                if (lastOrderId.HasValue)
                {
                    deliveryStatusInfo = await _wmsModule.GetDeliveryStatusAsync(lastOrderId.Value);
                }
            }

            // Map escalation priority
            var priority = DetermineTicketPriority(sentimentResult, deliveryStatusInfo, customerTier);

            // Save support ticket in the database
            var ticketSummary = $"Khách hàng khiếu nại (Sentiment: {sentimentResult.Sentiment}, Cường độ: {sentimentResult.Intensity:N2}): {messageContent}";
            if (ticketSummary.Length > 500)
            {
                ticketSummary = ticketSummary.Substring(0, 497) + "...";
            }
            
            var ticket = new SupportTicket(session.Id, customerId, priority, ticketSummary);
            _dbContext.SupportTickets.Add(ticket);

            // Call LLM with empathy-focused instructions
            var empatheticAnswer = await GenerateEmpatheticResponseAsync(messageContent, session.Messages.ToList(), deliveryStatusInfo, ct);

            // Persist the assistant's response
            var assistantMessage = new ChatMessage(session.Id, "assistant", empatheticAnswer); 
            session.AddMessage(assistantMessage);
            _dbContext.ChatMessages.Add(assistantMessage);
            
            // log
            foreach (var e in _dbContext.ChangeTracker.Entries())
            {
                Console.WriteLine(
                $"Entity={e.Entity.GetType().Name}, State={e.State}");

                if (e.Entity is ChatMessage m)
                    {
                    Console.WriteLine(
                    $"  MessageId={m.Id}");
                    }
            }
            
            try
{
    await _dbContext.SaveChangesAsync(ct);
}
catch (DbUpdateConcurrencyException ex)
{
    Console.WriteLine("=== CONCURRENCY EXCEPTION ===");

    foreach (var entry in ex.Entries)
    {
        Console.WriteLine(
            $"Concurrency Entity: {entry.Entity.GetType().Name}");

        Console.WriteLine(
            $"State: {entry.State}");

        if (entry.Entity is ChatMessage msg)
        {
            Console.WriteLine(
                $"MessageId: {msg.Id}");
        }

        if (entry.Entity is ChatSession chatSession)
        {
            Console.WriteLine(
                $"SessionId: {chatSession.Id}");
        }
    }

    throw;
}

            return new ChatOrchestratorResponse(
                empatheticAnswer, 
                session.Id, 
                new List<ProductContractDto>(),
                sentimentResult.Sentiment,
                sentimentResult.Intensity
            );
        }
        else
        {
            // ROUTE B: Standard RAG Flow (Consulting and material counting)
            
            // Map message history to Microsoft.Extensions.AI schemas
            var chatHistory = session.Messages
                .Where(m => m.Id != userMessage.Id) // Exclude current message
                .Select(m => new LlmChatMessage(
                    m.Role.Equals("user", StringComparison.OrdinalIgnoreCase) ? ChatRole.User : ChatRole.Assistant,
                    m.Content
                ))
                .ToList();

            var ragResult = await _ragService.AskAsync(messageContent, chatHistory, customerTier, ct);

            // Persist the assistant's response
            var assistantMessage = new ChatMessage(session.Id, "assistant", ragResult.Answer);
            session.AddMessage(assistantMessage);
            _dbContext.ChatMessages.Add(assistantMessage);
            
            // Single database save for the entire consultation path
            await _dbContext.SaveChangesAsync(ct);

            return new ChatOrchestratorResponse(
                ragResult.Answer,
                session.Id,
                ragResult.MatchedProducts,
                sentimentResult.Sentiment,
                sentimentResult.Intensity
            );
        }
    }

    #region Helpers

    /// <summary>
    /// Dynamically determines ticket escalation priority using sentiment metrics and shipment delays.
    /// </summary>
    private static TicketPriority DetermineTicketPriority(
        SentimentResultLlmDto sentiment, 
        string? deliveryStatusInfo,
        string customerTier)
    {
        // VIP Contractor / Dealer accounts always merit High/Urgent priorities
        if (customerTier.Equals("Contractor", StringComparison.OrdinalIgnoreCase) || 
            customerTier.Equals("Dealer", StringComparison.OrdinalIgnoreCase))
        {
            return sentiment.Intensity > 0.7 ? TicketPriority.Urgent : TicketPriority.High;
        }

        // Search for delays within delivery logistics status string
        if (deliveryStatusInfo != null && 
            (deliveryStatusInfo.Contains("trễ", StringComparison.OrdinalIgnoreCase) || 
             deliveryStatusInfo.Contains("muộn", StringComparison.OrdinalIgnoreCase) || 
             deliveryStatusInfo.Contains("thất bại", StringComparison.OrdinalIgnoreCase)))
        {
            return TicketPriority.Urgent;
        }

        // Standard prioritization based on emotional intensity
        if (sentiment.Intensity > 0.7)
        {
            return TicketPriority.Urgent;
        }
        
        if (sentiment.Intensity > 0.4)
        {
            return TicketPriority.High;
        }

        return TicketPriority.Medium;
    }

    /// <summary>
    /// Instructs the LLM to write an empathetic support reply.
    /// </summary>
    private async Task<string> GenerateEmpatheticResponseAsync(
        string userMessage,
        List<VLXD.Modules.AI.Domain.Entities.ChatMessage> history,
        string? deliveryInfo,
        CancellationToken ct)
    {
        var promptBuilder = new System.Text.StringBuilder();
        promptBuilder.AppendLine("Bạn là chuyên viên chăm sóc khách hàng của VLXD Smart System. Khách hàng đang có phản hồi tiêu cực (tức giận, lo lắng, hoặc khiếu nại). Nhiệm vụ của bạn là trả lời xoa dịu, thể hiện sự đồng cảm sâu sắc, cam kết xử lý và cung cấp thông tin hữu ích.");
        
        if (!string.IsNullOrEmpty(deliveryInfo))
        {
            promptBuilder.AppendLine($"\nThông tin vận chuyển đơn hàng gần nhất của họ: \"{deliveryInfo}\".");
            promptBuilder.AppendLine("Hãy sử dụng thông tin vận chuyển này để giải thích rõ trạng thái cho khách hàng.");
        }
        else
        {
            promptBuilder.AppendLine("\nHệ thống đã tự động tạo một Ticket hỗ trợ khẩn cấp (Urgent Support Ticket) gửi trực tiếp tới đội ngũ kỹ thuật/vận hành để liên hệ và giải quyết trực tiếp cho khách hàng trong vòng 15-30 phút.");
        }

        var messages = new List<LlmChatMessage>
        {
            new LlmChatMessage(ChatRole.System, promptBuilder.ToString())
        };

        // Add history references
        foreach (var msg in history.TakeLast(6))
        {
            messages.Add(new LlmChatMessage(
                msg.Role.Equals("user", StringComparison.OrdinalIgnoreCase) ? ChatRole.User : ChatRole.Assistant,
                msg.Content
            ));
        }

        var result = await _chatClient.CompleteAsync(messages, null, ct);
        return result.Message.Text ?? "Chúng tôi vô cùng xin lỗi vì sự bất tiện này. Một nhân viên hỗ trợ sẽ liên hệ trực tiếp với bạn ngay lập tức.";
    }

    #endregion

    #endregion
}
