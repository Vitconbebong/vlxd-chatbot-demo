using System;
using VLXD.Modules.WMS.Domain.Interfaces;

namespace VLXD.Modules.WMS.Infrastructure.MockAdapters;

/// <summary>
/// Mock delivery tracking adapter that simulates vehicle movement around Ho Chi Minh City.
/// </summary>
public class MockDeliveryTracker : IDeliveryTracker
{
    #region Fields

    private static readonly Random Rand = new();

    #endregion

    #region Methods

    /// <summary>
    /// Gets the current location of the vehicle, adding minor random offsets to simulate movement.
    /// </summary>
    public (double Latitude, double Longitude) GetCurrentLocation(Guid vehicleId)
    {
        // Saigon center coords
        double baseLat = 10.762622;
        double baseLng = 106.660172;

        // Apply a small deterministic offset based on vehicleId Guid hash code, plus tiny random movement
        int hash = vehicleId.GetHashCode();
        double offsetLat = (hash % 100) * 0.001;
        double offsetLng = ((hash / 100) % 100) * 0.001;

        double randomLat = (Rand.NextDouble() - 0.5) * 0.0005;
        double randomLng = (Rand.NextDouble() - 0.5) * 0.0005;

        return (baseLat + offsetLat + randomLat, baseLng + offsetLng + randomLng);
    }

    #endregion
}
