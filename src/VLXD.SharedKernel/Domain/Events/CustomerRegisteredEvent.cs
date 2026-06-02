using System;
using MediatR;

namespace VLXD.SharedKernel.Domain.Events;

/// <summary>
/// Event published when a new customer registers, allowing other modules to synchronize.
/// </summary>
public record CustomerRegisteredEvent(
    Guid CustomerId,
    string Name,
    string Phone,
    string Email,
    string Address,
    string Tier
) : INotification;
