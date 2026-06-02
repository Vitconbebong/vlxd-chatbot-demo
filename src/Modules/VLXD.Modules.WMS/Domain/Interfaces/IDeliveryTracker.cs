using System;

namespace VLXD.Modules.WMS.Domain.Interfaces;

/// <summary>
/// Defines tracking contract for vehicle delivery operations.
/// </summary>
public interface IDeliveryTracker
{
    #region Methods

    /// <summary>
    /// Gets the current location of a vehicle by its identifier.
    /// </summary>
    (double Latitude, double Longitude) GetCurrentLocation(Guid vehicleId);

    #endregion
}
