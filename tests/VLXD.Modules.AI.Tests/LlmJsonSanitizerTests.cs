using System;
using System.Text.Json.Serialization;
using VLXD.Modules.AI.Application.Services;
using Xunit;

namespace VLXD.Modules.AI.Tests;

/// <summary>
/// Unit tests for the LlmJsonSanitizer utility class.
/// </summary>
public class LlmJsonSanitizerTests
{
    #region Test DTOs

    private class SampleDto
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("value")]
        public int Value { get; set; }
    }

    #endregion

    #region Test Methods

    [Fact]
    public void Sanitize_ShouldStripMarkdownFences()
    {
        // Arrange
        var input = "```json\n{\n  \"name\": \"Prime\",\n  \"value\": 10\n}\n```";

        // Act
        var result = LlmJsonSanitizer.Sanitize(input);

        // Assert
        Assert.Equal("{\n  \"name\": \"Prime\",\n  \"value\": 10\n}", result);
    }

    [Fact]
    public void Sanitize_ShouldExtractJson_WhenTrailingTextIsPresent()
    {
        // Arrange
        var input = "Here is the result:\n```\n{\n  \"name\": \"Prime\",\n  \"value\": 10\n}\n```\nHope it helps!";

        // Act
        var result = LlmJsonSanitizer.Sanitize(input);

        // Assert
        Assert.Equal("{\n  \"name\": \"Prime\",\n  \"value\": 10\n}", result);
    }

    [Fact]
    public void ParseLlmJson_ShouldDeserializeCorrectly()
    {
        // Arrange
        var input = "```json\n{\n  \"name\": \"Prime\",\n  \"value\": 100\n}\n```";

        // Act
        var result = LlmJsonSanitizer.ParseLlmJson<SampleDto>(input);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("Prime", result.Name);
        Assert.Equal(100, result.Value);
    }

    [Fact]
    public void ParseLlmJson_ShouldReturnNull_OnMalformedJson()
    {
        // Arrange
        var input = "```json\n{\n  \"name\": \"Prime\",\n  \"value\": malformed_value_here\n}\n```";

        // Act
        var result = LlmJsonSanitizer.ParseLlmJson<SampleDto>(input);

        // Assert
        Assert.Null(result);
    }

    #endregion
}
