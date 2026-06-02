using System;
using VLXD.Modules.AI.Domain.Enums;
using VLXD.SharedKernel.Domain;

namespace VLXD.Modules.AI.Domain.Entities;

/// <summary>
/// Represents a customer support ticket escalated from negative sentiment chat sessions.
/// </summary>
public class SupportTicket : Entity
{
    #region Properties

    /// <summary>
    /// Gets the chat session identifier that triggered this ticket.
    /// </summary>
    public Guid SessionId { get; private set; }

    /// <summary>
    /// Gets the customer identifier, or null for guests.
    /// </summary>
    public Guid? CustomerId { get; private set; }

    /// <summary>
    /// Gets the priority level of the escalated ticket.
    /// </summary>
    public TicketPriority Priority { get; private set; }

    /// <summary>
    /// Gets the status of the ticket (e.g. "Open", "InProgress", "Resolved", "Closed").
    /// </summary>
    public string Status { get; private set; }

    /// <summary>
    /// Gets the short summary description of the issue.
    /// </summary>
    public string Summary { get; private set; }

    /// <summary>
    /// Gets the identifier of the staff member assigned to resolve the ticket.
    /// </summary>
    public Guid? AssignedTo { get; private set; }

    /// <summary>
    /// Gets the date and time when the ticket was resolved.
    /// </summary>
    public DateTime? ResolvedAt { get; private set; }

    #endregion

    #region Navigation Properties

    /// <summary>
    /// Gets the chat session associated with this ticket.
    /// </summary>
    [System.Text.Json.Serialization.JsonIgnore]
    public virtual ChatSession? Session { get; private set; }

    #endregion

    #region Constructors

    /// <summary>
    /// EF Core constructor.
    /// </summary>
    private SupportTicket() { }

    /// <summary>
    /// Initializes a new instance of the SupportTicket class.
    /// </summary>
    public SupportTicket(Guid sessionId, Guid? customerId, TicketPriority priority, string summary)
    {
        SessionId = sessionId;
        CustomerId = customerId;
        Priority = priority;
        Summary = summary;
        Status = "Open";
    }

    #endregion

    #region Methods

    /// <summary>
    /// Assigns the ticket to a staff member.
    /// </summary>
    public void Assign(Guid employeeId)
    {
        AssignedTo = employeeId;
        Status = "InProgress";
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Resolves the ticket.
    /// </summary>
    public void Resolve()
    {
        Status = "Resolved";
        ResolvedAt = DateTime.UtcNow;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Closes the ticket.
    /// </summary>
    public void Close()
    {
        Status = "Closed";
        UpdatedAt = DateTime.UtcNow;
    }

    #endregion
}
