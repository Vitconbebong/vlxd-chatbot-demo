using System;
using System.Collections.Generic;
using VLXD.Modules.AI.Application.Services;
using VLXD.SharedKernel.Application.Contracts;
using Xunit;

namespace VLXD.Modules.AI.Tests;

/// <summary>
/// Unit tests for the MaterialCalculator service.
/// </summary>
public class MaterialCalculatorTests
{
    #region Test Methods

    [Fact]
    public void CalculateNeededMaterial_ShouldCalculateCorrectQuantityAndCost_ForRetailCustomer()
    {
        // Arrange
        var calculator = new MaterialCalculator();
        var product = new ProductContractDto(
            Id: Guid.NewGuid(),
            Sku: "G-001",
            Name: "Gạch Men Prime 60x60",
            BasePrice: 150000,
            UnitOfMeasure: "m2",
            UnitsPerPackage: 1.44m, // 1.44 m2 per box
            CoveragePerPackage: 1.44m,
            WastageRate: 0.10m, // 10% wastage
            PriceTiers: new List<PriceTierContractDto>()
        );

        // Act - Calculate for 10m2
        var result = calculator.CalculateNeededMaterial(product, 10m, "Retail");

        // Assert
        // adjustedArea = 10 * 1.10 = 11m2
        // packagesNeeded = Ceiling(11 / 1.44) = Ceiling(7.638) = 8 boxes
        // totalQuantity = 8 * 1.44 = 11.52m2
        // totalCost = 8 * 150000 = 1,200,000 VND
        Assert.Equal(8, result.PackagesNeeded);
        Assert.Equal(11.52m, result.TotalQuantity);
        Assert.Equal(1200000m, result.TotalCost);
        Assert.Equal(0.10m, result.WastageApplied);
        Assert.True(string.IsNullOrEmpty(result.ErrorMessage));
    }

    [Fact]
    public void CalculateNeededMaterial_ShouldApplyTieredDiscountPrice_ForContractorCustomer()
    {
        // Arrange
        var calculator = new MaterialCalculator();
        var priceTiers = new List<PriceTierContractDto>
        {
            new PriceTierContractDto("Contractor", 130000, 1),   // Base Contractor price
            new PriceTierContractDto("Contractor", 120000, 10)  // Contractor price for 10+ boxes
        };

        var product = new ProductContractDto(
            Id: Guid.NewGuid(),
            Sku: "G-001",
            Name: "Gạch Men Prime 60x60",
            BasePrice: 150000,
            UnitOfMeasure: "m2",
            UnitsPerPackage: 1.44m,
            CoveragePerPackage: 1.44m,
            WastageRate: 0.05m, // 5% wastage
            PriceTiers: priceTiers
        );

        // Act - Calculate for 15m2 (needs around 11 boxes)
        var result = calculator.CalculateNeededMaterial(product, 15m, "Contractor");

        // Assert
        // adjustedArea = 15 * 1.05 = 15.75m2
        // packagesNeeded = Ceiling(15.75 / 1.44) = 11 boxes
        // Since quantity is 11 >= 10, the price should be 120,000 VND instead of 130,000 or 150,000.
        // totalCost = 11 * 120000 = 1,320,000 VND
        Assert.Equal(11, result.PackagesNeeded);
        Assert.Equal(1320000m, result.TotalCost);
        Assert.True(string.IsNullOrEmpty(result.ErrorMessage));
    }

    [Fact]
    public void CalculateNeededMaterial_ShouldReturnError_WhenCoveragePerPackageIsMissing()
    {
        // Arrange
        var calculator = new MaterialCalculator();
        var product = new ProductContractDto(
            Id: Guid.NewGuid(),
            Sku: "C-001",
            Name: "Cát xây tô",
            BasePrice: 250000,
            UnitOfMeasure: "m3",
            UnitsPerPackage: null,
            CoveragePerPackage: null, // No coverage per package (bulk item)
            WastageRate: 0.0m,
            PriceTiers: new List<PriceTierContractDto>()
        );

        // Act
        var result = calculator.CalculateNeededMaterial(product, 10m, "Retail");

        // Assert
        Assert.Equal(0, result.PackagesNeeded);
        Assert.Equal(0m, result.TotalQuantity);
        Assert.Equal(0m, result.TotalCost);
        Assert.False(string.IsNullOrEmpty(result.ErrorMessage));
        Assert.Contains("không được bán theo định mức diện tích phủ", result.ErrorMessage);
    }

    #endregion
}
