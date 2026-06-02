using System;
using VLXD.Modules.Catalog.Domain.Entities;
using Xunit;

namespace VLXD.Modules.Catalog.Tests;

public class ProductTests
{
    [Fact]
    public void ProductConstructor_ShouldSetPropertiesCorrectly()
    {
        // Arrange
        var sku = "VLXD-G001";
        var name = "Gạch Terrazzo 400x400";
        var description = "Gạch lát vỉa hè, sân vườn";
        var categoryId = Guid.NewGuid();
        var basePrice = 120000m;
        var unitOfMeasure = "Viên";
        var unitsPerPackage = 6m;
        var coveragePerPackage = 0.96m;
        var wastageRate = 0.05m;
        var imageUrl = "http://example.com/image.png";

        // Act
        var product = new Product(
            sku,
            name,
            description,
            categoryId,
            basePrice,
            unitOfMeasure,
            unitsPerPackage,
            coveragePerPackage,
            wastageRate,
            imageUrl
        );

        // Assert
        Assert.Equal(sku, product.Sku);
        Assert.Equal(name, product.Name);
        Assert.Equal(description, product.Description);
        Assert.Equal(categoryId, product.CategoryId);
        Assert.Equal(basePrice, product.BasePrice);
        Assert.Equal(unitOfMeasure, product.UnitOfMeasure);
        Assert.Equal(unitsPerPackage, product.UnitsPerPackage);
        Assert.Equal(coveragePerPackage, product.CoveragePerPackage);
        Assert.Equal(wastageRate, product.WastageRate);
        Assert.Equal(imageUrl, product.ImageUrl);
        Assert.True(product.IsActive);
    }

    [Fact]
    public void CategorySelfReferencing_ShouldAllowHierarchy()
    {
        // Arrange
        var parentCategory = new Category { Name = "Vật liệu thô", SortOrder = 1 };
        var childCategory = new Category { Name = "Cát xây dựng", SortOrder = 2, Parent = parentCategory };

        parentCategory.Children.Add(childCategory);

        // Assert
        Assert.Contains(childCategory, parentCategory.Children);
        Assert.Equal(parentCategory, childCategory.Parent);
    }
}
