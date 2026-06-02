using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.AI;
using VLXD.Modules.AI.Domain.Entities;
using VLXD.SharedKernel.Application.Contracts;
using LlmChatMessage = Microsoft.Extensions.AI.ChatMessage;

namespace VLXD.Modules.AI.Application.Services;

/// <summary>
/// Response data containing the RAG generated answer alongside matched catalog products.
/// </summary>
public record RagResponse(string Answer, List<ProductContractDto> MatchedProducts);

/// <summary>
/// Service coordinating Retrieval-Augmented Generation (RAG) for consulting and quantity estimations.
/// </summary>
public class RagService
{
    #region Fields

    private static readonly Regex AreaRegex = new(
        @"(\d+(?:[.,]\d+)?)\s*(?:m2|m²|mét\s*vuông|met\s*vuong|m\s*vuông)",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    private readonly VectorSearchService _vectorSearchService;
    private readonly IChatClient _chatClient;
    private readonly MaterialCalculator _materialCalculator;

    #endregion

    #region Constructors

    /// <summary>
    /// Initializes a new instance of the RagService class.
    /// </summary>
    public RagService(
        VectorSearchService vectorSearchService,
        IChatClient chatClient,
        MaterialCalculator materialCalculator)
    {
        _vectorSearchService = vectorSearchService;
        _chatClient = chatClient;
        _materialCalculator = materialCalculator;
    }

    #endregion

    #region Methods

    /// <summary>
    /// Coordinates vector search, optional volume estimation, prompt assembly, and LLM text generation.
    /// </summary>
    public virtual async Task<RagResponse> AskAsync(
        string question, 
        List<LlmChatMessage> chatHistory,
        string customerTier = "Retail", 
        CancellationToken ct = default)
    {
        // 1. Semantic search to fetch top 3 matching products from the database
        var matchedEmbeddings = await _vectorSearchService.SearchAsync(question, topK: 3, ct);
        var products = matchedEmbeddings.Select(x => x.Product).ToList();

        // 2. Parse question to detect area measurements (e.g. "20m2", "30 mét vuông")
        decimal? detectedArea = ParseAreaFromText(question);
        var calculationDetails = new StringBuilder();

        if (detectedArea.HasValue && products.Count > 0)
        {
            calculationDetails.AppendLine("--- KẾT QUẢ ĐỊNH LƯỢNG VẬT TƯ (TÍNH TỰ ĐỘNG BỞI HỆ THỐNG): ---");
            foreach (var product in products)
            {
                var calc = _materialCalculator.CalculateNeededMaterial(product, detectedArea.Value, customerTier);
                if (string.IsNullOrEmpty(calc.ErrorMessage))
                {
                    calculationDetails.AppendLine($"- Sản phẩm: {product.Name} (SKU: {product.Sku})");
                    calculationDetails.AppendLine($"  + Diện tích: {detectedArea.Value:N2} m² (Đã cộng hao hụt {product.WastageRate * 100:N0}%)");
                    calculationDetails.AppendLine($"  + Số lượng cần mua: {calc.PackagesNeeded} thùng/bao/lít (Tổng quy cách: {calc.TotalQuantity:N1} {product.UnitOfMeasure})");
                    calculationDetails.AppendLine($"  + Đơn giá hội viên ({customerTier}): {ResolveUnitPrice(product, calc.PackagesNeeded, customerTier):N0} VNĐ");
                    calculationDetails.AppendLine($"  + Tổng chi phí tạm tính: {calc.TotalCost:N0} VNĐ");
                }
                else
                {
                    calculationDetails.AppendLine($"- Sản phẩm: {product.Name} (SKU: {product.Sku}): {calc.ErrorMessage}");
                }
            }
            calculationDetails.AppendLine("------------------------------------------------------------------");
        }

        // 3. Assemble prompt context containing system instructions, matched products, and calculations
        var systemInstruction = await LoadSystemPromptAsync();
        var contextBuilder = new StringBuilder();
        
        contextBuilder.AppendLine("Dưới đây là thông tin về các sản phẩm liên quan từ Catalog hệ thống:");
        foreach (var p in products)
        {
            contextBuilder.AppendLine($"- {p.Name} (SKU: {p.Sku}), Giá cơ bản: {p.BasePrice:N0} VNĐ/{p.UnitOfMeasure}.");
            if (p.CoveragePerPackage.HasValue)
            {
                contextBuilder.AppendLine($"  + Định mức độ phủ: {p.CoveragePerPackage.Value:N2} m² mỗi đơn vị.");
            }
            if (p.UnitsPerPackage.HasValue)
            {
                contextBuilder.AppendLine($"  + Quy cách đóng gói: {p.UnitsPerPackage.Value:N1} {p.UnitOfMeasure} mỗi thùng/bao.");
            }
            contextBuilder.AppendLine($"  + Tỷ lệ hao hụt cộng thêm: {p.WastageRate * 100:N0}%.");
        }

        if (calculationDetails.Length > 0)
        {
            contextBuilder.AppendLine();
            contextBuilder.AppendLine(calculationDetails.ToString());
            contextBuilder.AppendLine("Lưu ý: Bạn phải ưu tiên dùng kết quả định lượng này để trả lời khách hàng.");
        }

        // 4. Build chat messages payload for LLM
        var messages = new List<LlmChatMessage>
        {
            new LlmChatMessage(ChatRole.System, systemInstruction),
            new LlmChatMessage(ChatRole.System, contextBuilder.ToString())
        };

        // Append historical messages for context window
        messages.AddRange(chatHistory.TakeLast(6));
        messages.Add(new LlmChatMessage(ChatRole.User, question));

        // 5. Query LLM to generate user facing response
        var result = await _chatClient.CompleteAsync(messages, null, ct);
        var answer = result.Message.Text ?? "Rất tiếc, tôi không thể xử lý câu hỏi này lúc này.";

        return new RagResponse(answer, products);
    }

    #region Helpers

    /// <summary>
    /// Reads the expert consultant prompt instructions template.
    /// </summary>
    private static async Task<string> LoadSystemPromptAsync()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Application", "Prompts", "ConsultantPrompt.txt");
        if (File.Exists(path))
        {
            return await File.ReadAllTextAsync(path);
        }

        // Fallback in case of path mismatches under compilation folders
        return "Bạn là nhân viên tư vấn vật liệu xây dựng chuyên nghiệp. Tư vấn báo giá dựa trên context sản phẩm.";
    }

    /// <summary>
    /// Parses area string measurements (e.g. 20m2) into decimals.
    /// </summary>
    private static decimal? ParseAreaFromText(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;

        var match = AreaRegex.Match(text);
        if (match.Success)
        {
            var rawValue = match.Groups[1].Value.Replace(',', '.');
            if (decimal.TryParse(rawValue, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out decimal result))
            {
                return result;
            }
        }

        return null;
    }

    /// <summary>
    /// Resolves unit price based on user tier and volume.
    /// </summary>
    private static decimal ResolveUnitPrice(ProductContractDto p, int quantity, string tierName)
    {
        if (p.PriceTiers == null || p.PriceTiers.Count == 0)
        {
            return p.BasePrice;
        }

        var tierPrice = p.PriceTiers
            .Where(t => t.TierName.Equals(tierName, StringComparison.OrdinalIgnoreCase) && quantity >= t.MinQuantity)
            .OrderByDescending(t => t.MinQuantity)
            .FirstOrDefault();

        if (tierPrice == null)
        {
            tierPrice = p.PriceTiers
                .Where(t => t.TierName.Equals(tierName, StringComparison.OrdinalIgnoreCase) && t.MinQuantity <= 1)
                .FirstOrDefault();
        }

        return tierPrice?.Price ?? p.BasePrice;
    }

    #endregion

    #endregion
}
