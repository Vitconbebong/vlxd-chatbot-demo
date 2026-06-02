using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VLXD.Modules.WMS.Infrastructure;
using VLXD.SharedKernel.Application.Contracts;

namespace VLXD.Modules.WMS.Infrastructure.Services;

/// <summary>
/// Implements cross-module WMS service operations defined in SharedKernel.
/// </summary>
public class WmsModuleService : IWmsModule
{
    #region Fields

    private readonly WmsDbContext _dbContext;

    #endregion

    #region Constructors

    /// <summary>
    /// Initializes a new instance of the WmsModuleService class.
    /// </summary>
    public WmsModuleService(WmsDbContext dbContext)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
    }

    #endregion

    #region Methods

    /// <summary>
    /// Gets the count of inventory items that are running low on stock.
    /// </summary>
    public async Task<int> GetLowStockCountAsync()
    {
        const decimal threshold = 10m;
        return await _dbContext.Inventory
            .CountAsync(i => (i.QuantityOnHand - i.QuantityReserved) < threshold);
    }

    /// <summary>
    /// Retrieves delivery status of a specific order.
    /// </summary>
    public async Task<string> GetDeliveryStatusAsync(Guid orderId)
    {
        var delivery = await _dbContext.DeliveryOrders
            .FirstOrDefaultAsync(d => d.OrderId == orderId);

        return delivery?.Status.ToString() ?? "Unknown";
    }

    /// <summary>
    /// Checks if there is sufficient stock available for a product across all warehouses.
    /// </summary>
    public async Task<bool> CheckStockAsync(Guid productId, decimal quantity)
    {
        var totalAvailable = await _dbContext.Inventory
            .Where(i => i.ProductId == productId)
            .SumAsync(i => (decimal?)(i.QuantityOnHand - i.QuantityReserved)) ?? 0m;

        return totalAvailable >= quantity;
    }

    #endregion
}
