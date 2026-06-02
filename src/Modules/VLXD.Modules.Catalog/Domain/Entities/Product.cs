using System;
using System.Collections.Generic;
using VLXD.SharedKernel.Domain;

namespace VLXD.Modules.Catalog.Domain.Entities;

/// <summary>
/// Represents a construction material product in the catalog.
/// </summary>
public class Product : Entity
{
    #region Properties

    /// <summary>
    /// Gets or sets the unique Stock Keeping Unit identifier (e.g., VLXD-G001).
    /// </summary>
    public string Sku { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the display name of the construction material.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the description containing specifications or usage info.
    /// </summary>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the category ID this product belongs to.
    /// </summary>
    public Guid CategoryId { get; set; }

    /// <summary>
    /// Gets or sets the base retail price for B2C transactions.
    /// </summary>
    public decimal BasePrice { get; set; }

    /// <summary>
    /// Gets or sets the primary unit of measure (e.g., "Thùng", "Bao", "Khối(m³)", "Cây", "Viên").
    /// </summary>
    public string UnitOfMeasure { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the number of physical units within one package (e.g., 6 pieces/box).
    /// Null signifies bulk items sold by weight or volume.
    /// </summary>
    public decimal? UnitsPerPackage { get; set; }

    /// <summary>
    /// Gets or sets the area coverage per package in square meters (e.g., 1.44 m2/box).
    /// Null signifies items that do not cover surface areas.
    /// </summary>
    public decimal? CoveragePerPackage { get; set; }

    /// <summary>
    /// Gets or sets the standard wastage rate multiplier for calculation buffers (e.g., 0.05 = 5%).
    /// </summary>
    public decimal WastageRate { get; set; }

    /// <summary>
    /// Gets or sets the URL of the product image.
    /// </summary>
    public string? ImageUrl { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether the product is active and visible to buyers.
    /// </summary>
    public bool IsActive { get; set; } = true;

    #endregion

    #region Constructors

    /// <summary>
    /// Required default constructor for Entity Framework Core.
    /// </summary>
    public Product() : base()
    {
    }

    /// <summary>
    /// Initializes a new instance of the Product class.
    /// </summary>
    public Product(
        string sku,
        string name,
        string description,
        Guid categoryId,
        decimal basePrice,
        string unitOfMeasure,
        decimal? unitsPerPackage,
        decimal? coveragePerPackage,
        decimal wastageRate,
        string? imageUrl = null) : base()
    {
        Sku = sku;
        Name = name;
        Description = description;
        CategoryId = categoryId;
        BasePrice = basePrice;
        UnitOfMeasure = unitOfMeasure;
        UnitsPerPackage = unitsPerPackage;
        CoveragePerPackage = coveragePerPackage;
        WastageRate = wastageRate;
        ImageUrl = imageUrl;
        IsActive = true;
    }

    #endregion

    #region Navigation Properties

    /// <summary>
    /// Gets or sets the parent category details.
    /// </summary>
    public virtual Category? Category { get; set; }

    /// <summary>
    /// Gets or sets the key-value technical specifications for the product.
    /// </summary>
    public virtual ICollection<ProductSpec> Specs { get; set; } = new List<ProductSpec>();

    /// <summary>
    /// Gets or sets search terms or synonyms associated with this product.
    /// </summary>
    public virtual ICollection<ProductAlias> Aliases { get; set; } = new List<ProductAlias>();

    /// <summary>
    /// Gets or sets pricing tiers defined for B2B, wholesale, or dealer customers.
    /// </summary>
    public virtual ICollection<PriceTier> PriceTiers { get; set; } = new List<PriceTier>();

    #endregion
}
