using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.AI;
using VLXD.SharedKernel.Application.Contracts;
using LlmChatMessage = Microsoft.Extensions.AI.ChatMessage;

namespace VLXD.Modules.AI.Application.Services;

/// <summary>
/// DTO representing an extracted material item returned from the LLM extraction prompt.
/// </summary>
public class ExtractedItemLlmDto
{
    #region Properties

    /// <summary>
    /// Gets or sets the name/description of the item.
    /// </summary>
    [JsonPropertyName("item_name")]
    public string ItemName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the requested quantity.
    /// </summary>
    [JsonPropertyName("quantity")]
    public int Quantity { get; set; }

    /// <summary>
    /// Gets or sets the raw unit of measurement.
    /// </summary>
    [JsonPropertyName("unit")]
    public string Unit { get; set; } = string.Empty;

    #endregion
}

/// <summary>
/// Service responsible for parsing unstructured material requests into structured quotation drafts.
/// </summary>
public class EntityExtractionService
{
    #region Fields

    private readonly IChatClient _chatClient;
    private readonly ICatalogModule _catalogModule;
    private readonly ISalesModule _salesModule;
    private readonly FuzzyMatchService _fuzzyMatchService;

    #endregion

    #region Constructors

    /// <summary>
    /// Initializes a new instance of the EntityExtractionService class.
    /// </summary>
    public EntityExtractionService(
        IChatClient chatClient,
        ICatalogModule catalogModule,
        ISalesModule salesModule,
        FuzzyMatchService fuzzyMatchService)
    {
        _chatClient = chatClient;
        _catalogModule = catalogModule;
        _salesModule = salesModule;
        _fuzzyMatchService = fuzzyMatchService;
    }

    #endregion

    #region Methods

    /// <summary>
    /// Extracts structured materials from raw requests, fuzzy matches products, resolves prices, and creates a sales quotation draft.
    /// </summary>
    public async Task<Guid> ExtractAndCreateQuotationAsync(
        string rawText, 
        Guid customerId, 
        string customerTier = "Retail", 
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(rawText))
        {
            throw new ArgumentException("Input request text cannot be empty.", nameof(rawText));
        }

        // 1. Call LLM to extract items and quantities in structured JSON format
        var extractionPrompt = await LoadExtractionPromptAsync();
        
        var messages = new List<LlmChatMessage>
        {
            new LlmChatMessage(ChatRole.System, extractionPrompt),
            new LlmChatMessage(ChatRole.User, rawText)
        };

        var response = await _chatClient.CompleteAsync(messages, null, ct);
        var rawJson = response.Message.Text ?? string.Empty;

        // 2. Sanitize and deserialize LLM output
        var extractedItems = LlmJsonSanitizer.ParseLlmJson<List<ExtractedItemLlmDto>>(rawJson) 
                             ?? new List<ExtractedItemLlmDto>();

        // 3. For each extracted item, query catalog and compute similarity
        var quotationItems = new List<QuotationItemContractDto>();

        foreach (var item in extractedItems)
        {
            if (string.IsNullOrWhiteSpace(item.ItemName)) continue;

            // Search catalog products (takes advantage of alias indices inside database)
            var candidates = await _catalogModule.SearchProductsAsync(item.ItemName);

            // Compute Levenshtein similarity to select the absolute best fit
            var fuzzyMatch = _fuzzyMatchService.FindBestMatch(item.ItemName, candidates);

            Guid? matchedProductId = null;
            decimal unitPrice = 0;
            decimal confidenceScore = 0;
            string unit = item.Unit;

            if (fuzzyMatch != null)
            {
                matchedProductId = fuzzyMatch.Product.Id;
                confidenceScore = (decimal)fuzzyMatch.Score;
                unit = fuzzyMatch.Product.UnitOfMeasure; // Standardize unit of measure from catalog
                unitPrice = ResolveUnitPrice(fuzzyMatch.Product, item.Quantity, customerTier);
            }

            quotationItems.Add(new QuotationItemContractDto(
                matchedProductId,
                item.ItemName,
                item.Quantity,
                unit,
                unitPrice,
                confidenceScore
            ));
        }

        // 4. Save quotation draft via the sales module contract interface
        var quotationId = await _salesModule.CreateQuotationDraftAsync(customerId, rawText, quotationItems);

        return quotationId;
    }

    #region Helpers

    /// <summary>
    /// Loads the prompt instructions template from disk.
    /// </summary>
    private static async Task<string> LoadExtractionPromptAsync()
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Application", "Prompts", "ExtractionPrompt.txt");
        if (File.Exists(path))
        {
            return await File.ReadAllTextAsync(path);
        }

        return "Trích xuất mảng JSON chứa: item_name, quantity, unit từ tin nhắn yêu cầu báo giá.";
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
