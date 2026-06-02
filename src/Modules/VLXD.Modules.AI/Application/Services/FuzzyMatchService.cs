using System;
using System.Collections.Generic;
using System.Linq;
using VLXD.SharedKernel.Application.Contracts;

namespace VLXD.Modules.AI.Application.Services;

/// <summary>
/// Data structure returning fuzzy match search results.
/// </summary>
public record FuzzyMatchResult(ProductContractDto Product, double Score);

/// <summary>
/// Service providing string distance matching algorithms (e.g. Levenshtein Distance) to associate user text search terms with catalog items.
/// </summary>
public class FuzzyMatchService
{
    #region Methods

    /// <summary>
    /// Finds the best catalog product match out of candidate products based on Levenshtein similarity.
    /// </summary>
    public FuzzyMatchResult? FindBestMatch(string searchTerm, List<ProductContractDto> candidates)
    {
        if (string.IsNullOrWhiteSpace(searchTerm) || candidates == null || candidates.Count == 0)
        {
            return null;
        }

        var searchLower = searchTerm.Trim().ToLower();
        FuzzyMatchResult? bestMatch = null;

        foreach (var p in candidates)
        {
            // 1. Check for exact SKU match
            if (p.Sku.Equals(searchLower, StringComparison.OrdinalIgnoreCase))
            {
                return new FuzzyMatchResult(p, 1.0);
            }

            // 2. Check for exact Name match
            if (p.Name.Equals(searchLower, StringComparison.OrdinalIgnoreCase))
            {
                return new FuzzyMatchResult(p, 1.0);
            }

            // 3. Compute Levenshtein similarity on Name
            double similarity = CalculateSimilarity(searchLower, p.Name.ToLower());

            if (bestMatch == null || similarity > bestMatch.Score)
            {
                bestMatch = new FuzzyMatchResult(p, similarity);
            }
        }

        // Return best match only if it meets a minimum acceptable threshold
        return bestMatch != null && bestMatch.Score >= 0.4 ? bestMatch : null;
    }

    /// <summary>
    /// Computes similarity score between 0.0 and 1.0 based on Levenshtein distance.
    /// </summary>
    public static double CalculateSimilarity(string s, string t)
    {
        int maxLen = Math.Max(s.Length, t.Length);
        if (maxLen == 0)
        {
            return 1.0;
        }

        int distance = CalculateLevenshteinDistance(s, t);
        return 1.0 - (double)distance / maxLen;
    }

    /// <summary>
    /// Standard dynamic programming algorithm to calculate edit distance between two strings.
    /// </summary>
    public static int CalculateLevenshteinDistance(string s, string t)
    {
        if (string.IsNullOrEmpty(s))
        {
            return string.IsNullOrEmpty(t) ? 0 : t.Length;
        }
        if (string.IsNullOrEmpty(t))
        {
            return s.Length;
        }

        int n = s.Length;
        int m = t.Length;
        int[,] d = new int[n + 1, m + 1];

        for (int i = 0; i <= n; d[i, 0] = i++) { }
        for (int j = 0; j <= m; d[0, j] = j++) { }

        for (int i = 1; i <= n; i++)
        {
            for (int j = 1; j <= m; j++)
            {
                int cost = (t[j - 1] == s[i - 1]) ? 0 : 1;
                d[i, j] = Math.Min(
                    Math.Min(d[i - 1, j] + 1, d[i, j - 1] + 1),
                    d[i - 1, j - 1] + cost);
            }
        }

        return d[n, m];
    }

    #endregion
}
