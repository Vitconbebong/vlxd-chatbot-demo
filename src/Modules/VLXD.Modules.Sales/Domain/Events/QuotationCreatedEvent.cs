using System;
using VLXD.SharedKernel.Domain;

namespace VLXD.Modules.Sales.Domain.Events;

/// <summary>
/// Domain event published when an AI quotation is successfully generated.
/// </summary>
public record QuotationCreatedEvent : IDomainEvent
{
    #region Properties

    /// <summary>
    /// Gets the unique identifier of the generated quotation.
    /// </summary>
    public Guid QuotationId { get; init; }

    /// <summary>
    /// Gets the unique identifier for the event instance.
    /// </summary>
    public Guid EventId { get; init; } = Guid.NewGuid();

    /// <summary>
    /// Gets the timestamp when the domain event occurred.
    /// </summary>
    public DateTime OccurredOn { get; init; } = DateTime.UtcNow;

    #endregion

    #region Constructors

    /// <summary>
    /// Initializes a new instance of the QuotationCreatedEvent record.
    /// </summary>
    /// <param name="quotationId">The quotation ID.</param>
    public QuotationCreatedEvent(Guid quotationId)
    {
        QuotationId = quotationId;
    }

    #endregion
}
