using System;
using VLXD.Modules.AI.Domain.Enums;
using VLXD.SharedKernel.Domain;

namespace VLXD.Modules.AI.Domain.Entities;

/// <summary>
/// Represents a single message within a chat session.
/// </summary>
public class ChatMessage : Entity
{
    #region Properties

    /// <summary>
    /// Gets the associated session identifier.
    /// </summary>
    public Guid SessionId { get; private set; }

    /// <summary>
    /// Gets the role of the message sender (e.g. "user", "assistant", "system").
    /// </summary>
    public string Role { get; private set; }

    /// <summary>
    /// Gets the content body of the message.
    /// </summary>
    public string Content { get; private set; }

    /// <summary>
    /// Gets or sets the analyzed sentiment level of the message. Null if not analyzed yet.
    /// </summary>
    public SentimentLevel? Sentiment { get; set; }

    #endregion

    #region Navigation Properties

    /// <summary>
    /// Gets the parent chat session navigation property.
    /// </summary>
    [System.Text.Json.Serialization.JsonIgnore]
    public virtual ChatSession? Session { get; private set; }

    #endregion

    #region Constructors

    /// <summary>
    /// EF Core constructor.
    /// </summary>
    private ChatMessage() { }

    /// <summary>
    /// Initializes a new instance of the ChatMessage class.
    /// </summary>
    public ChatMessage(Guid sessionId, string role, string content, SentimentLevel? sentiment = null)
    {
        SessionId = sessionId;
        Role = role;
        Content = content;
        Sentiment = sentiment;
    }

    #endregion
}
