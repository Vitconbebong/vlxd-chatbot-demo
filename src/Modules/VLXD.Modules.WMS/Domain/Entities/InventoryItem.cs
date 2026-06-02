using System;
using VLXD.SharedKernel.Domain;

namespace VLXD.Modules.WMS.Domain.Entities;

/// <summary>
/// Tracks stock quantities for a specific product inside a specific warehouse.
/// </summary>
public class InventoryItem : Entity
{
    #region Properties

    /// <summary>
    /// Gets the associated Warehouse ID.
    /// </summary>
    public Guid WarehouseId { get; private set; }

    /// <summary>
    /// Gets the associated Product ID from the Catalog module.
    /// </summary>
    public Guid ProductId { get; private set; }

    /// <summary>
    /// Gets the actual physical stock quantity on hand.
    /// </summary>
    public decimal QuantityOnHand { get; private set; }

    /// <summary>
    /// Gets the stock quantity reserved for confirmed orders.
    /// </summary>
    public decimal QuantityReserved { get; private set; }

    /// <summary>
    /// Gets the warehouse storage bin location string.
    /// </summary>
    public string BinLocation { get; private set; } = string.Empty;

    /// <summary>
    /// Gets the net available stock quantity that can be sold.
    /// </summary>
    public decimal QuantityAvailable => QuantityOnHand - QuantityReserved;

    #endregion

    #region Navigation Properties

    /// <summary>
    /// Gets the warehouse navigation property.
    /// </summary>
    public virtual Warehouse? Warehouse { get; private set; }

    #endregion

    #region Constructors

    /// <summary>
    /// Required constructor for EF Core.
    /// </summary>
    protected InventoryItem() { }

    /// <summary>
    /// Initializes a new instance of the InventoryItem class.
    /// </summary>
    public InventoryItem(Guid warehouseId, Guid productId, decimal quantityOnHand, string binLocation)
    {
        if (quantityOnHand < 0)
            throw new ArgumentException("Quantity on hand cannot be negative.", nameof(quantityOnHand));

        WarehouseId = warehouseId;
        ProductId = productId;
        QuantityOnHand = quantityOnHand;
        QuantityReserved = 0;
        BinLocation = binLocation ?? string.Empty;
    }

    #endregion

    #region Methods

    /// <summary>
    /// Adds physical stock to the inventory item.
    /// </summary>
    public void ReceiveStock(decimal quantity)
    {
        if (quantity <= 0)
            throw new ArgumentException("Receive quantity must be positive.", nameof(quantity));

        QuantityOnHand += quantity;
    }

    /// <summary>
    /// Reserves stock for an order.
    /// </summary>
    public void ReserveStock(decimal quantity)
    {
        if (quantity <= 0)
            throw new ArgumentException("Reserve quantity must be positive.", nameof(quantity));

        if (quantity > QuantityAvailable)
            throw new InvalidOperationException($"Insufficient available stock for product {ProductId}. Requested: {quantity}, Available: {QuantityAvailable}");

        QuantityReserved += quantity;
    }

    /// <summary>
    /// Releases reserved stock when an order is cancelled.
    /// </summary>
    public void ReleaseReservedStock(decimal quantity)
    {
        if (quantity <= 0)
            throw new ArgumentException("Release quantity must be positive.", nameof(quantity));

        if (quantity > QuantityReserved)
            throw new InvalidOperationException($"Cannot release more stock than is reserved. Requested: {quantity}, Reserved: {QuantityReserved}");

        QuantityReserved -= quantity;
    }

    /// <summary>
    /// Deducts reserved stock physically when delivery occurs.
    /// </summary>
    public void ShipStock(decimal quantity)
    {
        if (quantity <= 0)
            throw new ArgumentException("Ship quantity must be positive.", nameof(quantity));

        if (quantity > QuantityReserved)
            throw new InvalidOperationException($"Cannot ship more stock than is reserved. Requested: {quantity}, Reserved: {QuantityReserved}");

        if (quantity > QuantityOnHand)
            throw new InvalidOperationException($"Cannot ship more stock than is on hand. Requested: {quantity}, On Hand: {QuantityOnHand}");

        QuantityReserved -= quantity;
        QuantityOnHand -= quantity;
    }

    /// <summary>
    /// Adjusts bin location.
    /// </summary>
    public void UpdateBinLocation(string binLocation)
    {
        BinLocation = binLocation ?? string.Empty;
    }

    #endregion
}
