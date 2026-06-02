using System;
using VLXD.Modules.WMS.Domain.Enums;
using VLXD.SharedKernel.Domain;

namespace VLXD.Modules.WMS.Domain.Entities;

/// <summary>
/// Records details of stock inbound, outbound, or transfer movements.
/// </summary>
public class StockMovement : Entity
{
    #region Properties

    /// <summary>
    /// Gets the Warehouse ID.
    /// </summary>
    public Guid WarehouseId { get; private set; }

    /// <summary>
    /// Gets the Product ID.
    /// </summary>
    public Guid ProductId { get; private set; }

    /// <summary>
    /// Gets the direction of the movement (Inbound, Outbound, Transfer).
    /// </summary>
    public MovementType MovementType { get; private set; }

    /// <summary>
    /// Gets the quantity of stock moved.
    /// </summary>
    public decimal Quantity { get; private set; }

    /// <summary>
    /// Gets the associated reference number (e.g. order number or inbound shipment receipt).
    /// </summary>
    public string ReferenceNumber { get; private set; } = string.Empty;

    /// <summary>
    /// Gets contextual notes describing this movement.
    /// </summary>
    public string Notes { get; private set; } = string.Empty;

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
    protected StockMovement() { }

    /// <summary>
    /// Initializes a new instance of the StockMovement class.
    /// </summary>
    public StockMovement(Guid warehouseId, Guid productId, MovementType movementType, decimal quantity, string referenceNumber, string notes)
    {
        if (quantity <= 0)
            throw new ArgumentException("Movement quantity must be positive.", nameof(quantity));

        WarehouseId = warehouseId;
        ProductId = productId;
        MovementType = movementType;
        Quantity = quantity;
        ReferenceNumber = referenceNumber ?? string.Empty;
        Notes = notes ?? string.Empty;
    }

    #endregion
}
