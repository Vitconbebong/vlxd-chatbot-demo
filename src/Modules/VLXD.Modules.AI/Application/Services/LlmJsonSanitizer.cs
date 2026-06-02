using System;
using System.Text.Json;

namespace VLXD.Modules.AI.Application.Services;

/// <summary>
/// Utility to clean and sanitize raw string outputs from LLMs containing markdown code blocks before JSON deserialization.
/// </summary>
public static class LlmJsonSanitizer
{
    #region Methods

    /// <summary>
    /// Strips markdown block fences and deserializes the clean JSON content.
    /// </summary>
    public static T? ParseLlmJson<T>(string rawOutput)
    {
        if (string.IsNullOrWhiteSpace(rawOutput))
        {
            return default;
        }

        var cleanJson = Sanitize(rawOutput);

        try
        {
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                AllowTrailingCommas = true
            };

            return JsonSerializer.Deserialize<T>(cleanJson, options);
        }
        catch (JsonException ex)
        {
            // Log or trace parsing error with full context
            Console.WriteLine($"[LlmJsonSanitizer Error]: Failed to deserialize JSON. Raw: {rawOutput}. Exception: {ex.Message}");
            return default;
        }
    }

    /// <summary>
    /// Extracts JSON content between code fences or outer bracket limits.
    /// </summary>
    public static string Sanitize(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
        {
            return string.Empty;
        }

        var text = input.Trim();

        // 1. Strip markdown fences if present
        if (text.Contains("```"))
        {
            // Extract content between markdown tags
            var startTag = "```json";
            var startIdx = text.IndexOf(startTag, StringComparison.OrdinalIgnoreCase);
            
            if (startIdx != -1)
            {
                startIdx += startTag.Length;
            }
            else
            {
                startIdx = text.IndexOf("```");
                if (startIdx != -1)
                {
                    startIdx += 3;
                }
            }

            var endIdx = text.LastIndexOf("```");

            if (startIdx != -1 && endIdx != -1 && endIdx > startIdx)
            {
                text = text.Substring(startIdx, endIdx - startIdx).Trim();
            }
        }

        // 2. Fallback to outer brackets if still messy (in case LLM leaves leading/trailing text outside block)
        var firstBracket = text.IndexOfAny(new[] { '{', '[' });
        var lastBracket = text.LastIndexOfAny(new[] { '}', ']' });

        if (firstBracket != -1 && lastBracket != -1 && lastBracket > firstBracket)
        {
            text = text.Substring(firstBracket, lastBracket - firstBracket + 1).Trim();
        }

        return text;
    }

    #endregion
}
