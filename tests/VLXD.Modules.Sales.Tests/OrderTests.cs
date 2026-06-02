using System;
using System.Linq;
using VLXD.Modules.Sales.Domain.Entities;
using VLXD.Modules.Sales.Domain.Enums;
using Xunit;

namespace VLXD.Modules.Sales.Tests;

public class OrderTests
{
    [Fact]
    public void Constructor_ShouldInitializeOrderWithDraftStatus()
    {
        // Arrange
        var customerId = Guid.NewGuid();
        var orderNumber = "ORD-20260601-0001";
        var address = "123 Main St";
        var notes = "Fast shipping";

        // Act
        var order = new Order(customerId, orderNumber, address, notes);

        // Assert
        Assert.Equal(customerId, order.CustomerId);
        Assert.Equal(orderNumber, order.OrderNumber);
        Assert.Equal(OrderStatus.Draft, order.Status);
        Assert.Equal(address, order.DeliveryAddress);
        Assert.Equal(notes, order.Notes);
        Assert.Equal(0, order.TotalAmount);
        Assert.Empty(order.Items);
    }

    [Fact]
    public void AddItem_ShouldAddProductAndRecalculateTotalAmount()
    {
        // Arrange
        var order = new Order(Guid.NewGuid(), "ORD-1", "Address", "Notes");
        var productId = Guid.NewGuid();

        // Act
        order.AddItem(productId, "Xi mang Ha Tien", 10, "Bao", 80000m);

        // Assert
        Assert.Single(order.Items);
        var item = order.Items.First();
        Assert.Equal(productId, item.ProductId);
        Assert.Equal("Xi mang Ha Tien", item.ProductName);
        Assert.Equal(10, item.Quantity);
        Assert.Equal("Bao", item.Unit);
        Assert.Equal(80000m, item.UnitPrice);
        Assert.Equal(800000m, item.Subtotal);
        Assert.Equal(800000m, order.TotalAmount);
    }

    [Fact]
    public void AddItem_ExistingProduct_ShouldIncreaseQuantityAndRecalculateTotal()
    {
        // Arrange
        var order = new Order(Guid.NewGuid(), "ORD-1", "Address", "Notes");
        var productId = Guid.NewGuid();

        // Act
        order.AddItem(productId, "Xi mang Ha Tien", 10, "Bao", 80000m);
        order.AddItem(productId, "Xi mang Ha Tien", 5, "Bao", 80000m);

        // Assert
        Assert.Single(order.Items);
        var item = order.Items.First();
        Assert.Equal(15, item.Quantity);
        Assert.Equal(1200000m, order.TotalAmount);
    }

    [Fact]
    public void Confirm_ShouldTransitionStatusToConfirmedAndRaiseDomainEvent()
    {
        // Arrange
        var order = new Order(Guid.NewGuid(), "ORD-1", "Address", "Notes");
        order.AddItem(Guid.NewGuid(), "Xi mang Ha Tien", 10, "Bao", 80000m);

        // Act
        order.Confirm();

        // Assert
        Assert.Equal(OrderStatus.Confirmed, order.Status);
        Assert.Single(order.DomainEvents);
    }

    [Fact]
    public void Confirm_WhenAlreadyConfirmed_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var order = new Order(Guid.NewGuid(), "ORD-1", "Address", "Notes");
        order.Confirm();

        // Act & Assert
        var ex = Assert.Throws<InvalidOperationException>(() => order.Confirm());
        Assert.Contains("Cannot confirm", ex.Message);
    }

    [Fact]
    public void StartDelivery_FromConfirmedState_ShouldTransitionToDelivering()
    {
        // Arrange
        var order = new Order(Guid.NewGuid(), "ORD-1", "Address", "Notes");
        order.Confirm();

        // Act
        order.StartDelivery();

        // Assert
        Assert.Equal(OrderStatus.Delivering, order.Status);
    }

    [Fact]
    public void StartDelivery_FromDraftState_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var order = new Order(Guid.NewGuid(), "ORD-1", "Address", "Notes");

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => order.StartDelivery());
    }

    [Fact]
    public void Complete_FromDeliveringState_ShouldTransitionToCompleted()
    {
        // Arrange
        var order = new Order(Guid.NewGuid(), "ORD-1", "Address", "Notes");
        order.Confirm();
        order.StartDelivery();

        // Act
        order.Complete();

        // Assert
        Assert.Equal(OrderStatus.Completed, order.Status);
    }

    [Fact]
    public void Complete_FromConfirmedState_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var order = new Order(Guid.NewGuid(), "ORD-1", "Address", "Notes");
        order.Confirm();

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => order.Complete());
    }

    [Fact]
    public void Cancel_FromDraft_ShouldTransitionToCancelled()
    {
        // Arrange
        var order = new Order(Guid.NewGuid(), "ORD-1", "Address", "Notes");

        // Act
        order.Cancel();

        // Assert
        Assert.Equal(OrderStatus.Cancelled, order.Status);
    }

    [Fact]
    public void Cancel_FromConfirmed_ShouldTransitionToCancelled()
    {
        // Arrange
        var order = new Order(Guid.NewGuid(), "ORD-1", "Address", "Notes");
        order.Confirm();

        // Act
        order.Cancel();

        // Assert
        Assert.Equal(OrderStatus.Cancelled, order.Status);
    }

    [Fact]
    public void Cancel_FromDelivering_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var order = new Order(Guid.NewGuid(), "ORD-1", "Address", "Notes");
        order.Confirm();
        order.StartDelivery();

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => order.Cancel());
    }
}
