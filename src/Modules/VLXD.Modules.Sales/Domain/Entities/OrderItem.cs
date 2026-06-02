using System;
using VLXD.SharedKernel.Domain;

namespace VLXD.Modules.Sales.Domain.Entities;

/// <summary>
/// Represents an item lines inside a customer order.
/// </summary>
public class OrderItem : Entity
{
    #region Properties

    /// <summary>
    /// Gets or sets the parent order identifier.
    /// </summary>
    public Guid OrderId { get; set; }

    /// <summary>
    /// Gets or sets the product identifier.
    /// </summary>
    public Guid ProductId { get; set; }

    /// <summary>
    /// Gets or sets the product name snapshot at purchase time.
    /// </summary>
    public string ProductName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the quantity ordered.
    /// </summary>
    public int Quantity { get; set; }

    /// <summary>
    /// Gets or sets the packaging unit (e.g. "Thùng", "Bao", "Khối(m³)").
    /// </summary>
    public string Unit { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the unit price snapshot at purchase time.
    /// </summary>
    public decimal UnitPrice { get; set; }

    /// <summary>
    /// Gets the computed subtotal of the line item.
    /// </summary>
    public decimal Subtotal => Quantity * UnitPrice;

    #endregion

    #region Constructors

    /// <summary>
    /// Required default constructor for Entity Framework Core.
    /// </summary>
    public OrderItem() : base()
    {
    }

    /// <summary>
    /// Initializes a new instance of the OrderItem class.
    /// </summary>
    public OrderItem(Guid productId, string productName, int quantity, string unit, decimal unitPrice) : base()
    {
        ProductId = productId;
        ProductName = productName;
        Quantity = quantity;
        Unit = unit;
        UnitPrice = unitPrice;
    }

    #endregion

    #region Navigation Properties

    /// <summary>
    /// Gets or sets the parent order navigation link.
    /// </summary>
    public virtual Order? Order { get; set; }

    #endregion
}
