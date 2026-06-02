using System;
using MediatR;

namespace VLXD.SharedKernel.Domain.Events;

/// <summary>
/// Event published when a customer profile is updated, allowing other modules to synchronize.
/// </summary>
public record CustomerUpdatedEvent(
    Guid CustomerId,
    string Name,
    string Phone,
    string Email,
    string Address,
    string Tier
) : INotification;
