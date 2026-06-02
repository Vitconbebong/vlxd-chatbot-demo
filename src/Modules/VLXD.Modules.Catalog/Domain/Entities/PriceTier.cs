using System;
using VLXD.SharedKernel.Domain;

namespace VLXD.Modules.Catalog.Domain.Entities;

/// <summary>
/// Represents a pricing tier for specific customer segments or wholesale volumes.
/// </summary>
public class PriceTier : Entity
{
    #region Properties

    /// <summary>
    /// Gets or sets the product identifier.
    /// </summary>
    public Guid ProductId { get; set; }

    /// <summary>
    /// Gets or sets the tier segment name (e.g., "Retail", "Contractor", "Dealer").
    /// </summary>
    public string TierName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the customized unit price for this tier.
    /// </summary>
    public decimal Price { get; set; }

    /// <summary>
    /// Gets or sets the minimum purchase quantity required to unlock this tier price.
    /// </summary>
    public int MinQuantity { get; set; }

    #endregion

    #region Constructors

    /// <summary>
    /// Required default constructor for Entity Framework Core.
    /// </summary>
    public PriceTier() : base()
    {
    }

    /// <summary>
    /// Initializes a new instance of the PriceTier class.
    /// </summary>
    public PriceTier(Guid productId, string tierName, decimal price, int minQuantity = 1) : base()
    {
        ProductId = productId;
        TierName = tierName;
        Price = price;
        MinQuantity = minQuantity;
    }

    #endregion

    #region Navigation Properties

    /// <summary>
    /// Gets or sets the product associated with this pricing tier.
    /// </summary>
    public virtual Product? Product { get; set; }

    #endregion
}
