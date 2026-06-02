using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Caching.Memory;
using VLXD.Modules.AI.Infrastructure;
using VLXD.SharedKernel.Application.Contracts;

namespace VLXD.Modules.AI.Application.Services;

/// <summary>
/// Result data structure returning matched product contracts coupled with their cosine similarity scores.
/// </summary>
public record VectorSearchResultDto(ProductContractDto Product, double SimilarityScore);

/// <summary>
/// Provides high-performance in-memory semantic vector search over catalog product embeddings.
/// </summary>
public class VectorSearchService
{
    #region Fields

    private const string EmbeddingsCacheKey = "ai_product_embeddings_cache";
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(10);

    private readonly IEmbeddingGenerator<string, Embedding<float>> _embeddingGenerator;
    private readonly AiDbContext _dbContext;
    private readonly ICatalogModule _catalogModule;
    private readonly IMemoryCache _memoryCache;

    #endregion

    #region Constructors

    /// <summary>
    /// Initializes a new instance of the VectorSearchService class.
    /// </summary>
    public VectorSearchService(
        IEmbeddingGenerator<string, Embedding<float>> embeddingGenerator,
        AiDbContext dbContext,
        ICatalogModule catalogModule,
        IMemoryCache memoryCache)
    {
        _embeddingGenerator = embeddingGenerator;
        _dbContext = dbContext;
        _catalogModule = catalogModule;
        _memoryCache = memoryCache;
    }

    #endregion

    #region Methods

    /// <summary>
    /// Executes cosine similarity search between query text and cached product embeddings.
    /// </summary>
    public async Task<List<VectorSearchResultDto>> SearchAsync(string query, int topK = 5, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return new List<VectorSearchResultDto>();
        }

        // 1. Generate vector embedding for the input search query
        var queryEmbeddingsResult = await _embeddingGenerator.GenerateAsync(new[] { query }, null, ct);
        var queryVector = queryEmbeddingsResult.FirstOrDefault()?.Vector.ToArray();

        if (queryVector == null || queryVector.Length == 0)
        {
            return new List<VectorSearchResultDto>();
        }

        // 2. Fetch all product vector representations from memory cache or database
        var cachedVectors = await GetOrLoadEmbeddingsAsync(ct);

        if (cachedVectors.Count == 0)
        {
            return new List<VectorSearchResultDto>();
        }

        // 3. Compute cosine similarity in-memory
        var similarityScores = new List<(Guid ProductId, double Score)>();
        foreach (var item in cachedVectors)
        {
            double score = ComputeCosineSimilarity(queryVector, item.Vector);
            similarityScores.Add((item.ProductId, score));
        }

        // 4. Sort and select top K identifiers
        var topMatchedIds = similarityScores
            .OrderByDescending(x => x.Score)
            .Take(topK)
            .ToList();

        // 5. Load full product contracts from catalog module
        var productIds = topMatchedIds.Select(x => x.ProductId).ToList();
        var products = await _catalogModule.GetProductsByIdsAsync(productIds);

        // 6. Assemble response mapping contracts to similarity scores
        var results = new List<VectorSearchResultDto>();
        foreach (var match in topMatchedIds)
        {
            var matchedProduct = products.FirstOrDefault(p => p.Id == match.ProductId);
            if (matchedProduct != null)
            {
                results.Add(new VectorSearchResultDto(matchedProduct, match.Score));
            }
        }

        return results;
    }

    /// <summary>
    /// Clears the memory cache to trigger reload of fresh embeddings.
    /// </summary>
    public void InvalidateCache()
    {
        _memoryCache.Remove(EmbeddingsCacheKey);
    }

    #region Helpers

    /// <summary>
    /// Computes cosine similarity index between two float vector coordinates.
    /// Range is between -1.0 and 1.0. Higher is closer.
    /// </summary>
    public static double ComputeCosineSimilarity(float[] vectorA, float[] vectorB)
    {
        if (vectorA.Length != vectorB.Length)
        {
            throw new ArgumentException("Vectors must have the same dimension length.");
        }

        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;

        for (int i = 0; i < vectorA.Length; i++)
        {
            dotProduct += vectorA[i] * vectorB[i];
            normA += vectorA[i] * vectorA[i];
            normB += vectorB[i] * vectorB[i];
        }

        if (normA == 0.0 || normB == 0.0)
        {
            return 0.0; // Avoid division by zero for null vectors
        }

        return dotProduct / (Math.Sqrt(normA) * Math.Sqrt(normB));
    }

    /// <summary>
    /// Retrieves deserialized float[] vectors from the cache, loading from DbContext on miss.
    /// </summary>
    private async Task<List<CachedEmbedding>> GetOrLoadEmbeddingsAsync(CancellationToken ct)
    {
        return await _memoryCache.GetOrCreateAsync(EmbeddingsCacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = CacheDuration;

            // Load all vector items from database
            var dbEmbeddings = await _dbContext.ProductEmbeddings.ToListAsync(ct);

            // Deserialize in batch
            return dbEmbeddings.Select(e => new CachedEmbedding(
                e.ProductId,
                EmbeddingService.DeserializeVector(e.Embedding)
            )).ToList();
        }) ?? new List<CachedEmbedding>();
    }

    private record CachedEmbedding(Guid ProductId, float[] Vector);

    #endregion

    #endregion
}
