using System;
using VLXD.Modules.WMS.Domain.Entities;
using Xunit;

namespace VLXD.Modules.WMS.Tests;

public class InventoryTests
{
    [Fact]
    public void Constructor_ShouldInitializeCorrectly()
    {
        // Arrange
        var warehouseId = Guid.NewGuid();
        var productId = Guid.NewGuid();
        var initialQty = 100m;
        var bin = "A-12";

        // Act
        var item = new InventoryItem(warehouseId, productId, initialQty, bin);

        // Assert
        Assert.Equal(warehouseId, item.WarehouseId);
        Assert.Equal(productId, item.ProductId);
        Assert.Equal(initialQty, item.QuantityOnHand);
        Assert.Equal(0m, item.QuantityReserved);
        Assert.Equal(initialQty, item.QuantityAvailable);
        Assert.Equal(bin, item.BinLocation);
    }

    [Fact]
    public void Constructor_WithNegativeQuantity_ShouldThrowArgumentException()
    {
        // Act & Assert
        Assert.Throws<ArgumentException>(() => new InventoryItem(Guid.NewGuid(), Guid.NewGuid(), -10m, "A-12"));
    }

    [Fact]
    public void ReceiveStock_ShouldIncreaseOnHandAndAvailable()
    {
        // Arrange
        var item = new InventoryItem(Guid.NewGuid(), Guid.NewGuid(), 100m, "A-12");

        // Act
        item.ReceiveStock(50m);

        // Assert
        Assert.Equal(150m, item.QuantityOnHand);
        Assert.Equal(0m, item.QuantityReserved);
        Assert.Equal(150m, item.QuantityAvailable);
    }

    [Fact]
    public void ReceiveStock_WithNonPositiveQuantity_ShouldThrowArgumentException()
    {
        // Arrange
        var item = new InventoryItem(Guid.NewGuid(), Guid.NewGuid(), 100m, "A-12");

        // Act & Assert
        Assert.Throws<ArgumentException>(() => item.ReceiveStock(0m));
        Assert.Throws<ArgumentException>(() => item.ReceiveStock(-5m));
    }

    [Fact]
    public void ReserveStock_ShouldIncreaseReservedAndDecreaseAvailable()
    {
        // Arrange
        var item = new InventoryItem(Guid.NewGuid(), Guid.NewGuid(), 100m, "A-12");

        // Act
        item.ReserveStock(30m);

        // Assert
        Assert.Equal(100m, item.QuantityOnHand);
        Assert.Equal(30m, item.QuantityReserved);
        Assert.Equal(70m, item.QuantityAvailable);
    }

    [Fact]
    public void ReserveStock_WithInsufficientStock_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var item = new InventoryItem(Guid.NewGuid(), Guid.NewGuid(), 50m, "A-12");

        // Act & Assert
        var ex = Assert.Throws<InvalidOperationException>(() => item.ReserveStock(60m));
        Assert.Contains("Insufficient available stock", ex.Message);
    }

    [Fact]
    public void ReleaseReservedStock_ShouldDecreaseReservedAndIncreaseAvailable()
    {
        // Arrange
        var item = new InventoryItem(Guid.NewGuid(), Guid.NewGuid(), 100m, "A-12");
        item.ReserveStock(40m);

        // Act
        item.ReleaseReservedStock(15m);

        // Assert
        Assert.Equal(100m, item.QuantityOnHand);
        Assert.Equal(25m, item.QuantityReserved);
        Assert.Equal(75m, item.QuantityAvailable);
    }

    [Fact]
    public void ReleaseReservedStock_WithExceededQuantity_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var item = new InventoryItem(Guid.NewGuid(), Guid.NewGuid(), 100m, "A-12");
        item.ReserveStock(20m);

        // Act & Assert
        var ex = Assert.Throws<InvalidOperationException>(() => item.ReleaseReservedStock(25m));
        Assert.Contains("Cannot release more stock than is reserved", ex.Message);
    }

    [Fact]
    public void ShipStock_ShouldDecreaseOnHandAndReserved()
    {
        // Arrange
        var item = new InventoryItem(Guid.NewGuid(), Guid.NewGuid(), 100m, "A-12");
        item.ReserveStock(30m);

        // Act
        item.ShipStock(20m);

        // Assert
        Assert.Equal(80m, item.QuantityOnHand);
        Assert.Equal(10m, item.QuantityReserved);
        Assert.Equal(70m, item.QuantityAvailable);
    }

    [Fact]
    public void ShipStock_WithExceededQuantity_ShouldThrowInvalidOperationException()
    {
        // Arrange
        var item = new InventoryItem(Guid.NewGuid(), Guid.NewGuid(), 100m, "A-12");
        item.ReserveStock(20m);

        // Act & Assert
        Assert.Throws<InvalidOperationException>(() => item.ShipStock(25m));
    }
}
