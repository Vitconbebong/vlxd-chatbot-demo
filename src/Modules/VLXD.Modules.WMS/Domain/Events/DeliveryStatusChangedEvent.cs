using System;
using VLXD.Modules.WMS.Domain.Enums;
using VLXD.SharedKernel.Domain;

namespace VLXD.Modules.WMS.Domain.Events;

/// <summary>
/// Event raised when the status of a delivery order changes.
/// </summary>
public record DeliveryStatusChangedEvent(Guid DeliveryOrderId, DeliveryStatus NewStatus) : IDomainEvent
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
