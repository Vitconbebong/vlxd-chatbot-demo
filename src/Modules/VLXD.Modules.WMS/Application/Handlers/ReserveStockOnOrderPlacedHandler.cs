using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VLXD.Modules.WMS.Domain.Entities;
using VLXD.Modules.WMS.Domain.Enums;
using VLXD.Modules.WMS.Infrastructure;
using VLXD.SharedKernel.Domain.Events;

namespace VLXD.Modules.WMS.Application.Handlers;

/// <summary>
/// Event handler that processes OrderPlacedEvent to reserve warehouse stock and create delivery orders.
/// </summary>
public class ReserveStockOnOrderPlacedHandler : INotificationHandler<OrderPlacedEvent>
{
    #region Fields

    private readonly WmsDbContext _dbContext;
    private readonly ILogger<ReserveStockOnOrderPlacedHandler> _logger;

    #endregion

    #region Constructors

    /// <summary>
    /// Initializes a new instance of the ReserveStockOnOrderPlacedHandler class.
    /// </summary>
    public ReserveStockOnOrderPlacedHandler(WmsDbContext dbContext, ILogger<ReserveStockOnOrderPlacedHandler> logger)
    {
        _dbContext = dbContext ?? throw new ArgumentNullException(nameof(dbContext));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    #endregion

    #region Methods

    /// <summary>
    /// Handles the OrderPlacedEvent.
    /// </summary>
    public async Task Handle(OrderPlacedEvent notification, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Processing stock reservation for Order ID: {OrderId}", notification.OrderId);

        var isStockSufficient = true;

        foreach (var item in notification.Items)
        {
            var inventoryItems = await _dbContext.Inventory
                .Where(i => i.ProductId == item.ProductId)
                .ToListAsync(cancellationToken);

            if (!inventoryItems.Any())
            {
                _logger.LogWarning("No inventory record found for Product ID: {ProductId}", item.ProductId);
                isStockSufficient = false;
                continue;
            }

            // Find a warehouse that can satisfy the quantity, or default to the first warehouse
            var inventoryItem = inventoryItems.FirstOrDefault(i => i.QuantityAvailable >= item.Quantity)
                                ?? inventoryItems.First();

            if (inventoryItem.QuantityAvailable < item.Quantity)
            {
                _logger.LogWarning(
                    "Insufficient stock for Product ID {ProductId} in Warehouse {WarehouseId}. Required: {Required}, Available: {Available}",
                    item.ProductId,
                    inventoryItem.WarehouseId,
                    item.Quantity,
                    inventoryItem.QuantityAvailable);
                isStockSufficient = false;
            }

            try
            {
                // Force reserve the stock (might throw if insufficient, depending on domain logic)
                // We attempt to reserve even if insufficient to register the intent (or log the deficiency)
                var reserveQty = Math.Min(item.Quantity, inventoryItem.QuantityAvailable);
                if (reserveQty > 0)
                {
                    inventoryItem.ReserveStock(reserveQty);

                    var movement = new StockMovement(
                        inventoryItem.WarehouseId,
                        item.ProductId,
                        MovementType.Outbound,
                        reserveQty,
                        notification.OrderId.ToString(),
                        $"Reserved stock for order: {notification.OrderId}");

                    _dbContext.StockMovements.Add(movement);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred reserving stock for Product ID: {ProductId}", item.ProductId);
                isStockSufficient = false;
            }
        }

        // Create a DeliveryOrder for this order (even if stock is partially insufficient, logistics will handle it)
        var deliveryOrder = new DeliveryOrder(
            notification.OrderId,
            notification.DeliveryAddress,
            isStockSufficient ? "Stock reserved successfully." : "Stock reservation incomplete due to low inventory.");

        _dbContext.DeliveryOrders.Add(deliveryOrder);

        await _dbContext.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Stock reservation process completed for Order ID: {OrderId}. Status: {Status}", 
            notification.OrderId, isStockSufficient ? "Sufficient" : "Insufficient/Warnings");
    }

    #endregion
}
