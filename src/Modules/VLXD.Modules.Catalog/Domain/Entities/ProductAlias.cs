using System;
using VLXD.SharedKernel.Domain;

namespace VLXD.Modules.Catalog.Domain.Entities;

/// <summary>
/// Represents a synonym or colloquial alias for a product to enhance fuzzy search capability.
/// </summary>
public class ProductAlias : Entity
{
    #region Properties

    /// <summary>
    /// Gets or sets the product identifier.
    /// </summary>
    public Guid ProductId { get; set; }

    /// <summary>
    /// Gets or sets the synonym/alias term (e.g., "xi HT" for "Xi măng Hà Tiên").
    /// </summary>
    public string AliasName { get; set; } = string.Empty;

    #endregion

    #region Constructors

    /// <summary>
    /// Required default constructor for Entity Framework Core.
    /// </summary>
    public ProductAlias() : base()
    {
    }

    /// <summary>
    /// Initializes a new instance of the ProductAlias class.
    /// </summary>
    public ProductAlias(Guid productId, string aliasName) : base()
    {
        ProductId = productId;
        AliasName = aliasName.ToLowerInvariant(); // Lowercase by default for search index consistency
    }

    #endregion

    #region Navigation Properties

    /// <summary>
    /// Gets or sets the product associated with this alias.
    /// </summary>
    public virtual Product? Product { get; set; }

    #endregion
}
