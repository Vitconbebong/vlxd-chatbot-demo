using System;
using VLXD.Modules.WMS.Domain.Enums;
using VLXD.Modules.WMS.Domain.Events;
using VLXD.SharedKernel.Domain;

namespace VLXD.Modules.WMS.Domain.Entities;

/// <summary>
/// Represents a delivery order tracked by WMS to coordinate dispatching and logistics.
/// </summary>
public class DeliveryOrder : AggregateRoot
{
    #region Properties

    /// <summary>
    /// Gets the Order ID from the Sales module.
    /// </summary>
    public Guid OrderId { get; private set; }

    /// <summary>
    /// Gets the assigned Vehicle ID.
    /// </summary>
    public Guid? VehicleId { get; private set; }

    /// <summary>
    /// Gets the delivery status (Pending, Dispatched, InTransit, Delivered, Failed).
    /// </summary>
    public DeliveryStatus Status { get; private set; }

    /// <summary>
    /// Gets the destination delivery address.
    /// </summary>
    public string DeliveryAddress { get; private set; } = string.Empty;

    /// <summary>
    /// Gets the estimated date/time of arrival.
    /// </summary>
    public DateTime? EstimatedArrival { get; private set; }

    /// <summary>
    /// Gets the actual date/time of arrival.
    /// </summary>
    public DateTime? ActualArrival { get; private set; }

    /// <summary>
    /// Gets any logs or notes.
    /// </summary>
    public string Notes { get; private set; } = string.Empty;

    #endregion

    #region Navigation Properties

    /// <summary>
    /// Gets the vehicle assigned to this delivery.
    /// </summary>
    public virtual Vehicle? Vehicle { get; private set; }

    #endregion

    #region Constructors

    /// <summary>
    /// Required constructor for EF Core.
    /// </summary>
    protected DeliveryOrder() { }

    /// <summary>
    /// Initializes a new instance of the DeliveryOrder class.
    /// </summary>
    public DeliveryOrder(Guid orderId, string deliveryAddress, string notes)
    {
        OrderId = orderId;
        DeliveryAddress = deliveryAddress ?? throw new ArgumentNullException(nameof(deliveryAddress));
        Notes = notes ?? string.Empty;
        Status = DeliveryStatus.Pending;
    }

    #endregion

    #region Methods

    /// <summary>
    /// Assigns a vehicle to the delivery order.
    /// </summary>
    public void AssignVehicle(Guid vehicleId)
    {
        if (Status != DeliveryStatus.Pending && Status != DeliveryStatus.Failed)
            throw new InvalidOperationException($"Cannot assign vehicle when delivery is in '{Status}' status.");

        VehicleId = vehicleId;
        Status = DeliveryStatus.Dispatched;
        EstimatedArrival = DateTime.UtcNow.AddHours(4); // Estimate delivery in 4 hours
        
        AddDomainEvent(new DeliveryStatusChangedEvent(Id, Status));
    }

    /// <summary>
    /// Updates status to InTransit.
    /// </summary>
    public void StartTransit()
    {
        if (Status != DeliveryStatus.Dispatched)
            throw new InvalidOperationException($"Cannot start transit from '{Status}' status. Must be Dispatched first.");

        Status = DeliveryStatus.InTransit;
        
        AddDomainEvent(new DeliveryStatusChangedEvent(Id, Status));
    }

    /// <summary>
    /// Completes the delivery successfully.
    /// </summary>
    public void CompleteDelivery()
    {
        if (Status != DeliveryStatus.InTransit)
            throw new InvalidOperationException($"Cannot complete delivery from '{Status}' status. Must be InTransit first.");

        Status = DeliveryStatus.Delivered;
        ActualArrival = DateTime.UtcNow;
        
        AddDomainEvent(new DeliveryStatusChangedEvent(Id, Status));
    }

    /// <summary>
    /// Marks the delivery as failed.
    /// </summary>
    public void FailDelivery(string reason)
    {
        if (Status != DeliveryStatus.InTransit)
            throw new InvalidOperationException($"Cannot fail delivery from '{Status}' status. Must be InTransit first.");

        Status = DeliveryStatus.Failed;
        Notes = string.IsNullOrWhiteSpace(Notes) ? $"Failure reason: {reason}" : $"{Notes} | Failure reason: {reason}";
        
        AddDomainEvent(new DeliveryStatusChangedEvent(Id, Status));
    }

    #endregion
}
