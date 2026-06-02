using System;
using System.Collections.Generic;
using VLXD.SharedKernel.Domain;

namespace VLXD.Modules.AI.Domain.Entities;

/// <summary>
/// Represents a chat conversation session between a customer and the AI agent.
/// </summary>
public class ChatSession : Entity
{
    #region Properties

    /// <summary>
    /// Gets the customer identifier associated with the session, or null for guests.
    /// </summary>
    public Guid? CustomerId { get; private set; }

    /// <summary>
    /// Gets the channels through which chat was initiated (e.g. "Web", "Zalo").
    /// </summary>
    public string Channel { get; private set; }

    /// <summary>
    /// Gets the time the session was started.
    /// </summary>
    public DateTime StartedAt { get; private set; }

    /// <summary>
    /// Gets the time of the last exchange in this session.
    /// </summary>
    public DateTime LastMessageAt { get; private set; }

    #endregion

    #region Navigation Properties

    /// <summary>
    /// Gets the collection of messages exchanged in this session.
    /// </summary>
    public virtual ICollection<ChatMessage> Messages { get; private set; } = new List<ChatMessage>();

    #endregion

    #region Constructors

    /// <summary>
    /// EF Core constructor.
    /// </summary>
    private ChatSession() { }

    /// <summary>
    /// Initializes a new instance of the ChatSession class.
    /// </summary>
    public ChatSession(Guid? customerId, string channel)
    {
        CustomerId = customerId;
        Channel = string.IsNullOrWhiteSpace(channel) ? "Web" : channel;
        StartedAt = DateTime.UtcNow;
        LastMessageAt = DateTime.UtcNow;
    }

    #endregion

    #region Methods

    /// <summary>
    /// Adds a message to this chat session.
    /// </summary>
    public void AddMessage(ChatMessage message)
    {
        Messages.Add(message);
        LastMessageAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Associates the chat session with a registered customer account.
    /// </summary>
    public void AssociateCustomer(Guid customerId)
    {
        if (CustomerId == null)
        {
            CustomerId = customerId;
            UpdatedAt = DateTime.UtcNow;
        }
    }

    #endregion
}
