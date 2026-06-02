using System;
using System.Collections.Generic;
using System.Linq;
using VLXD.Modules.Sales.Domain.Enums;
using VLXD.SharedKernel.Domain;
using VLXD.SharedKernel.Domain.Events;

namespace VLXD.Modules.Sales.Domain.Entities;

/// <summary>
/// Represents the Order aggregate root, managing items and shipping status.
/// </summary>
public class Order : AggregateRoot
{
    #region Properties

    /// <summary>
    /// Gets or sets the customer identifier.
    /// </summary>
    public Guid CustomerId { get; set; }

    /// <summary>
    /// Gets or sets the unique order number (e.g., ORD-20260601-0001).
    /// </summary>
    public string OrderNumber { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the order progress status.
    /// </summary>
    public OrderStatus Status { get; set; } = OrderStatus.Draft;

    /// <summary>
    /// Gets or sets the total price of all order item lines.
    /// </summary>
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// Gets or sets the physical shipping destination.
    /// </summary>
    public string DeliveryAddress { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets additional delivery instructions or customer comments.
    /// </summary>
    public string Notes { get; set; } = string.Empty;

    #endregion

    #region Constructors

    /// <summary>
    /// Required default constructor for Entity Framework Core.
    /// </summary>
    public Order() : base()
    {
    }

    /// <summary>
    /// Initializes a new instance of the Order class.
    /// </summary>
    public Order(Guid customerId, string orderNumber, string deliveryAddress, string notes) : base()
    {
        CustomerId = customerId;
        OrderNumber = orderNumber;
        Status = OrderStatus.Draft;
        DeliveryAddress = deliveryAddress;
        Notes = notes;
        TotalAmount = 0;
    }

    #endregion

    #region Navigation Properties

    /// <summary>
    /// Gets or sets the buying customer profiles.
    /// </summary>
    public virtual Customer? Customer { get; set; }

    /// <summary>
    /// Gets or sets the list of items in the order.
    /// </summary>
    public virtual ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();

    #endregion

    #region Domain Methods

    /// <summary>
    /// Adds a product item to the order and recomputes the total amount.
    /// </summary>
    public void AddItem(Guid productId, string productName, int quantity, string unit, decimal unitPrice)
    {
        if (Status != OrderStatus.Draft)
        {
            throw new InvalidOperationException("Cannot modify items after the order is out of Draft state.");
        }

        var existingItem = Items.FirstOrDefault(i => i.ProductId == productId);
        if (existingItem != null)
        {
            existingItem.Quantity += quantity;
        }
        else
        {
            Items.Add(new OrderItem(productId, productName, quantity, unit, unitPrice));
        }

        RecalculateTotalAmount();
    }

    /// <summary>
    /// Recalculates the total amount of the order by summing all items.
    /// </summary>
    private void RecalculateTotalAmount()
    {
        TotalAmount = Items.Sum(i => i.Subtotal);
    }

    /// <summary>
    /// Transitions order status from Draft to Confirmed and raises OrderPlacedEvent.
    /// </summary>
    public void Confirm()
    {
        if (Status != OrderStatus.Draft)
        {
            throw new InvalidOperationException($"Cannot confirm order in '{Status}' state.");
        }

        Status = OrderStatus.Confirmed;

                // Collect item details to notify WMS to reserve stock
        var orderItems = Items.Select(i => new OrderPlacedItem(i.ProductId, i.Quantity, i.Unit)).ToList();
        
        // Register event to notify inventory managers
        AddDomainEvent(new OrderPlacedEvent(Id, CustomerId, orderItems, DeliveryAddress, Notes));
    }

    /// <summary>
    /// Transitions order status from Confirmed to Delivering.
    /// </summary>
    public void StartDelivery()
    {
        if (Status != OrderStatus.Confirmed)
        {
            throw new InvalidOperationException($"Cannot start delivery for an order in '{Status}' state.");
        }

        Status = OrderStatus.Delivering;
    }

    /// <summary>
    /// Transitions order status from Delivering to Completed.
    /// </summary>
    public void Complete()
    {
        if (Status != OrderStatus.Delivering)
        {
            throw new InvalidOperationException($"Cannot complete an order in '{Status}' state.");
        }

        Status = OrderStatus.Completed;
    }

    /// <summary>
    /// Cancels the order, releasing reserved stock.
    /// </summary>
    public void Cancel()
    {
        if (Status == OrderStatus.Delivering || Status == OrderStatus.Completed)
        {
            throw new InvalidOperationException($"Cannot cancel an order in '{Status}' state.");
        }

        Status = OrderStatus.Cancelled;
    }

    #endregion
}
