using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Logging; // Đảm bảo đã có using này
using LlmChatMessage = Microsoft.Extensions.AI.ChatMessage;

namespace VLXD.Modules.AI.Application.Services;

public class SentimentResultLlmDto
{
    [JsonPropertyName("sentiment")]
    public string Sentiment { get; set; } = "Neutral";

    [JsonPropertyName("intensity")]
    public double Intensity { get; set; }
}

public class SentimentAnalyzer
{
    private readonly IChatClient _chatClient;
    private readonly ILogger<SentimentAnalyzer> _logger;

    public SentimentAnalyzer(IChatClient chatClient, ILogger<SentimentAnalyzer> logger)
    {
        _chatClient = chatClient;
        _logger = logger;
    }

    public virtual async Task<SentimentResultLlmDto> AnalyzeAsync(string text, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return new SentimentResultLlmDto { Sentiment = "Neutral", Intensity = 0.0 };
        }

        try
        {
            _logger.LogInformation("🚀 [SentimentAnalyzer] Bắt đầu gửi request tới Ollama. Nội dung: {Text}", text);

            var prompt = await LoadSentimentPromptAsync();
            var messages = new List<LlmChatMessage>
            {
                new LlmChatMessage(ChatRole.System, prompt),
                new LlmChatMessage(ChatRole.User, text)
            };

            var result = await _chatClient.CompleteAsync(messages, null, ct);
            var rawJson = result.Message.Text ?? string.Empty;

            _logger.LogInformation("✅ [SentimentAnalyzer] Nhận phản hồi từ AI: {RawJson}", rawJson);

            var sanitizedResult = LlmJsonSanitizer.ParseLlmJson<SentimentResultLlmDto>(rawJson);
            
            return sanitizedResult ?? new SentimentResultLlmDto { Sentiment = "Neutral", Intensity = 0.0 };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [SentimentAnalyzer] LỖI KHI GỌI AI!");
            
            if (ex.InnerException != null)
            {
                _logger.LogError("🔍 [SentimentAnalyzer] Chi tiết lỗi gốc: {Message}", ex.InnerException.Message);
            }

            // Trả về mặc định để ứng dụng không bị crash hoàn toàn
            return new SentimentResultLlmDto { Sentiment = "Neutral", Intensity = 0.0 };
        }
    }

    private static async Task<string> LoadSentimentPromptAsync()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Application", "Prompts", "SentimentPrompt.txt");
        if (File.Exists(path))
        {
            return await File.ReadAllTextAsync(path);
        }

        return "Phân tích cảm xúc văn bản. Trả về JSON duy nhất không kèm giải thích: {\"sentiment\": \"Positive/Neutral/Negative\", \"intensity\": 0.0-1.0}.";
    }
}