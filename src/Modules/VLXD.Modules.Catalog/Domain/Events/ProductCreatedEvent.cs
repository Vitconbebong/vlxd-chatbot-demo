using System;
using VLXD.SharedKernel.Domain;

namespace VLXD.Modules.Catalog.Domain.Events;

/// <summary>
/// Domain event published when a new product is successfully cataloged.
/// </summary>
public record ProductCreatedEvent : IDomainEvent
{
    #region Properties

    /// <summary>
    /// Gets the unique identifier of the newly created product.
    /// </summary>
    public Guid ProductId { get; init; }

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
    /// Initializes a new instance of the ProductCreatedEvent record.
    /// </summary>
    /// <param name="productId">The product ID.</param>
    public ProductCreatedEvent(Guid productId)
    {
        ProductId = productId;
    }

    #endregion
}
