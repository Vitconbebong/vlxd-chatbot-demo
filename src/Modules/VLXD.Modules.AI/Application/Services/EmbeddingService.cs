using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.AI;
using VLXD.Modules.AI.Domain.Entities;
using VLXD.Modules.AI.Infrastructure;
using VLXD.SharedKernel.Application.Contracts;

namespace VLXD.Modules.AI.Application.Services;

/// <summary>
/// Service responsible for generating and storing vector embeddings for catalog products.
/// </summary>
public class EmbeddingService
{
    #region Fields

    private readonly IEmbeddingGenerator<string, Embedding<float>> _embeddingGenerator;
    private readonly AiDbContext _dbContext;
    private readonly ICatalogModule _catalogModule;
    private readonly VectorSearchService _vectorSearchService;

    #endregion

    #region Constructors

    /// <summary>
    /// Initializes a new instance of the EmbeddingService class.
    /// </summary>
    public EmbeddingService(
        IEmbeddingGenerator<string, Embedding<float>> embeddingGenerator,
        AiDbContext dbContext,
        ICatalogModule catalogModule,
        VectorSearchService vectorSearchService)
    {
        _embeddingGenerator = embeddingGenerator;
        _dbContext = dbContext;
        _catalogModule = catalogModule;
        _vectorSearchService = vectorSearchService;
    }

    #endregion

    #region Methods

    /// <summary>
    /// Generates and saves vector embedding for a single product.
    /// </summary>
    public async Task EmbedProductAsync(ProductContractDto product, CancellationToken ct = default)
    {
        // 1. Build rich semantic text representation of the product
        var richText = BuildRichText(product);

        // 2. Generate vector embedding using Ollama nomic-embed-text
        var embeddingsResult = await _embeddingGenerator.GenerateAsync(new[] { richText }, null, ct);
        var embeddingVector = embeddingsResult.FirstOrDefault()?.Vector.ToArray();

        if (embeddingVector == null || embeddingVector.Length == 0)
        {
            throw new InvalidOperationException($"Failed to generate embedding for product {product.Name}");
        }

        // 3. Serialize float[] vector to binary byte[]
        var serializedVector = SerializeVector(embeddingVector);

        // 4. Save or update embedding record in the database
        var existingEmbedding = await _dbContext.ProductEmbeddings
            .FirstOrDefaultAsync(x => x.ProductId == product.Id, ct);

        if (existingEmbedding != null)
        {
            existingEmbedding.Update(richText, serializedVector);
        }
        else
        {
            var newEmbedding = new ProductEmbedding(product.Id, richText, serializedVector);
            _dbContext.ProductEmbeddings.Add(newEmbedding);
        }

        await _dbContext.SaveChangesAsync(ct);

        // 5. Invalidate the memory cache to ensure fresh embeddings are loaded on next search
        _vectorSearchService.InvalidateCache();
    }

    /// <summary>
    /// Generates embeddings for all active catalog products in a single batch and invalidates the cache.
    /// </summary>
    public async Task EmbedAllProductsAsync(CancellationToken ct = default)
    {
        // Retrieve all active products via catalog contract (empty query returns all)
        var products = await _catalogModule.SearchProductsAsync(string.Empty);
        if (products == null || !products.Any())
        {
            return;
        }

        var productList = products.ToList();
        
        // 1. Build rich semantic text representations
        var richTexts = productList.Select(BuildRichText).ToList();

        // 2. Generate vector embeddings in a single batch
        var embeddingsResult = await _embeddingGenerator.GenerateAsync(richTexts, null, ct);
        var embeddingsList = embeddingsResult.ToList();

        if (embeddingsList.Count != productList.Count)
        {
            throw new InvalidOperationException("Batched embedding generation size mismatch.");
        }

        // 3. Process database inserts/updates
        var productIds = productList.Select(p => p.Id).ToList();
        var existingEmbeddings = await _dbContext.ProductEmbeddings
            .Where(x => productIds.Contains(x.ProductId))
            .ToDictionaryAsync(x => x.ProductId, ct);

        for (int i = 0; i < productList.Count; i++)
        {
            var product = productList[i];
            var richText = richTexts[i];
            var embeddingVector = embeddingsList[i].Vector.ToArray();

            if (embeddingVector == null || embeddingVector.Length == 0)
            {
                continue;
            }

            var serializedVector = SerializeVector(embeddingVector);

            if (existingEmbeddings.TryGetValue(product.Id, out var existing))
            {
                existing.Update(richText, serializedVector);
            }
            else
            {
                var newEmbedding = new ProductEmbedding(product.Id, richText, serializedVector);
                _dbContext.ProductEmbeddings.Add(newEmbedding);
            }
        }

        // 4. Save all changes in one transaction
        await _dbContext.SaveChangesAsync(ct);

        // 5. Invalidate the memory cache
        _vectorSearchService.InvalidateCache();
    }

    #region Helpers

    /// <summary>
    /// Serializes a float array into a byte array using Buffer.BlockCopy for performance.
    /// </summary>
    public static byte[] SerializeVector(float[] vector)
    {
        var bytes = new byte[vector.Length * sizeof(float)];
        Buffer.BlockCopy(vector, 0, bytes, 0, bytes.Length);
        return bytes;
    }

    /// <summary>
    /// Deserializes a byte array back into a float array.
    /// </summary>
    public static float[] DeserializeVector(byte[] bytes)
    {
        var vector = new float[bytes.Length / sizeof(float)];
        Buffer.BlockCopy(bytes, 0, vector, 0, bytes.Length);
        return vector;
    }

    /// <summary>
    /// Assembles a rich text paragraph containing full product specs for embedding context.
    /// </summary>
    private static string BuildRichText(ProductContractDto p)
    {
        var details = new List<string>
        {
            $"Tên sản phẩm: {p.Name}",
            $"SKU: {p.Sku}",
            $"Đơn vị tính: {p.UnitOfMeasure}",
            $"Giá cơ bản: {p.BasePrice:N0} VNĐ"
        };

        if (p.CoveragePerPackage.HasValue && p.CoveragePerPackage > 0)
        {
            details.Add($"Diện tích phủ (định mức): {p.CoveragePerPackage.Value:N2} m² mỗi thùng/bao/lít");
        }

        if (p.UnitsPerPackage.HasValue && p.UnitsPerPackage > 0)
        {
            details.Add($"Quy cách: {p.UnitsPerPackage.Value:N1} đơn vị mỗi thùng/bao");
        }

        details.Add($"Tỷ lệ hao hụt dự kiến: {(p.WastageRate * 100):N0}%");

        if (p.PriceTiers != null && p.PriceTiers.Count > 0)
        {
            var tiers = p.PriceTiers.Select(t => $"{t.TierName}: {t.Price:N0} VNĐ (từ {t.MinQuantity} {p.UnitOfMeasure})");
            details.Add($"Mức chiết khấu đại lý & nhà thầu: {string.Join(", ", tiers)}");
        }

        return string.Join(". ", details) + ".";
    }

    #endregion

    #endregion
}
