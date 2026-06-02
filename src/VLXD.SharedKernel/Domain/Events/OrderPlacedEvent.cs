using System;
using System.Collections.Generic;

namespace VLXD.SharedKernel.Domain.Events;

/// <summary>
/// Domain event item representing product quantity details in a placed order.
/// </summary>
public record OrderPlacedItem(Guid ProductId, decimal Quantity, string Unit);

/// <summary>
/// Event published when a customer places an order, triggering WMS inventory reservation.
/// </summary>
public record OrderPlacedEvent : IDomainEvent
{
    #region Properties

    /// <summary>
    /// Gets the unique identifier of the placed order.
    /// </summary>
    public Guid OrderId { get; init; }

    /// <summary>
    /// Gets the purchasing customer identifier.
    /// </summary>
    public Guid CustomerId { get; init; }

    /// <summary>
    /// Gets the list of items in the placed order.
    /// </summary>
    public List<OrderPlacedItem> Items { get; init; }

    /// <summary>
    /// Gets the destination address for delivery.
    /// </summary>
    public string DeliveryAddress { get; init; }

    /// <summary>
    /// Gets any special notes for the delivery.
    /// </summary>
    public string Notes { get; init; }

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
    /// Initializes a new instance of the OrderPlacedEvent record.
    /// </summary>
    public OrderPlacedEvent(Guid orderId, Guid customerId, List<OrderPlacedItem> items, string deliveryAddress, string notes)
    {
        OrderId = orderId;
        CustomerId = customerId;
        Items = items;
        DeliveryAddress = deliveryAddress ?? string.Empty;
        Notes = notes ?? string.Empty;
    }

    #endregion
}
