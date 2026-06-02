using System;
using System.Collections.Generic;
using VLXD.SharedKernel.Domain;

namespace VLXD.Modules.WMS.Domain.Entities;

/// <summary>
/// Represents a delivery vehicle with current location tracking.
/// </summary>
public class Vehicle : Entity
{
    #region Properties

    /// <summary>
    /// Gets the vehicle plate registration number.
    /// </summary>
    public string PlateNumber { get; private set; } = string.Empty;

    /// <summary>
    /// Gets the name of the assigned driver.
    /// </summary>
    public string DriverName { get; private set; } = string.Empty;

    /// <summary>
    /// Gets the contact phone number of the driver.
    /// </summary>
    public string DriverPhone { get; private set; } = string.Empty;

    /// <summary>
    /// Gets the vehicle's last recorded latitude location.
    /// </summary>
    public double CurrentLat { get; private set; }

    /// <summary>
    /// Gets the vehicle's last recorded longitude location.
    /// </summary>
    public double CurrentLng { get; private set; }

    /// <summary>
    /// Gets the status of the vehicle (e.g. Available, OnDelivery, Maintenance).
    /// </summary>
    public string CurrentStatus { get; private set; } = "Available";

    #endregion

    #region Navigation Properties

    /// <summary>
    /// Gets delivery orders assigned to this vehicle.
    /// </summary>
    public virtual ICollection<DeliveryOrder> DeliveryOrders { get; private set; } = new List<DeliveryOrder>();

    #endregion

    #region Constructors

    /// <summary>
    /// Required constructor for EF Core.
    /// </summary>
    protected Vehicle() { }

    /// <summary>
    /// Initializes a new instance of the Vehicle class.
    /// </summary>
    public Vehicle(string plateNumber, string driverName, string driverPhone)
    {
        PlateNumber = plateNumber ?? throw new ArgumentNullException(nameof(plateNumber));
        DriverName = driverName ?? throw new ArgumentNullException(nameof(driverName));
        DriverPhone = driverPhone ?? throw new ArgumentNullException(nameof(driverPhone));
        CurrentLat = 10.762622; // Default Saigon coordinates
        CurrentLng = 106.660172;
        CurrentStatus = "Available";
    }

    #endregion

    #region Methods

    /// <summary>
    /// Updates the vehicle location.
    /// </summary>
    public void UpdateLocation(double latitude, double longitude)
    {
        CurrentLat = latitude;
        CurrentLng = longitude;
    }

    /// <summary>
    /// Updates the vehicle status.
    /// </summary>
    public void UpdateStatus(string status)
    {
        CurrentStatus = status ?? throw new ArgumentNullException(nameof(status));
    }

    #endregion
}
