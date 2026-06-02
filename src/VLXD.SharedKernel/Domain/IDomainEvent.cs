using MediatR;

namespace VLXD.SharedKernel.Domain;

/// <summary>
/// Contract for all domain events in the system to enable in-process messaging.
/// </summary>
public interface IDomainEvent : INotification
{
    #region Properties

    /// <summary>
    /// Gets the unique identifier for the event instance.
    /// </summary>
    Guid EventId { get; }

    /// <summary>
    /// Gets the timestamp when the domain event occurred.
    /// </summary>
    DateTime OccurredOn { get; }

    #endregion
}
