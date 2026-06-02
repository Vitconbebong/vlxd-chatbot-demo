using System;
using System.Collections.Generic;
using VLXD.SharedKernel.Domain;

namespace VLXD.Modules.WMS.Domain.Events;

/// <summary>
/// Event details for reserved item.
/// </summary>
public record ReservedStockItem(Guid ProductId, decimal Quantity);

/// <summary>
/// Event raised when inventory stock has been successfully reserved for an order.
/// </summary>
public record StockReservedEvent(Guid OrderId, List<ReservedStockItem> Items) : IDomainEvent
{
    #region Properties

    /// <summary>
    /// Gets the unique identifier for the event instance.
    /// </summary>
    public Guid EventId { get; init; } = Guid.NewGuid();

    /// <summary>
    /// Gets the timestamp when the domain event occurred.
    /// </summary>
    public DateTime OccurredOn { get; init; } = DateTime.UtcNow;

    #endregion
}
