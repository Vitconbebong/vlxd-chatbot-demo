using System;
using VLXD.SharedKernel.Domain;

namespace VLXD.Modules.Catalog.Domain.Entities;

/// <summary>
/// Represents a technical specification of a product (e.g., "Kích thước" -> "400x400 mm").
/// </summary>
public class ProductSpec : Entity
{
    #region Properties

    /// <summary>
    /// Gets or sets the product identifier.
    /// </summary>
    public Guid ProductId { get; set; }

    /// <summary>
    /// Gets or sets the specification key.
    /// </summary>
    public string SpecKey { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the specification value.
    /// </summary>
    public string SpecValue { get; set; } = string.Empty;

    #endregion

    #region Constructors

    /// <summary>
    /// Required default constructor for Entity Framework Core.
    /// </summary>
    public ProductSpec() : base()
    {
    }

    /// <summary>
    /// Initializes a new instance of the ProductSpec class.
    /// </summary>
    public ProductSpec(Guid productId, string specKey, string specValue) : base()
    {
        ProductId = productId;
        SpecKey = specKey;
        SpecValue = specValue;
    }

    #endregion

    #region Navigation Properties

    /// <summary>
    /// Gets or sets the product associated with this specification.
    /// </summary>
    public virtual Product? Product { get; set; }

    #endregion
}
