using System;
using System.Threading.Tasks;

namespace VLXD.SharedKernel.Application.Contracts;

/// <summary>
/// Shared contract for warehouse and inventory operations requested by other modules.
/// </summary>
public interface IWmsModule
{
    #region Methods

    /// <summary>
    /// Checks the low stock warnings count.
    /// </summary>
    Task<int> GetLowStockCountAsync();

    /// <summary>
    /// Retrieves a delivery status description for an order.
    /// </summary>
    Task<string> GetDeliveryStatusAsync(Guid orderId);

    /// <summary>
    /// Checks if a warehouse holds sufficient stock for a product.
    /// </summary>
    Task<bool> CheckStockAsync(Guid productId, decimal quantity);

    #endregion
}
