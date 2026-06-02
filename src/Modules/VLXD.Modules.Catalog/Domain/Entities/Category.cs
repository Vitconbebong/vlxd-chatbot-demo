using System;
using System.Collections.Generic;
using VLXD.SharedKernel.Domain;

namespace VLXD.Modules.Catalog.Domain.Entities;

/// <summary>
/// Represents a product category in the catalog. Can be nested in a parent-child hierarchy.
/// </summary>
public class Category : Entity
{
    #region Properties

    /// <summary>
    /// Gets or sets the category name.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the parent category identifier. Null means this is a top-level category.
    /// </summary>
    public Guid? ParentId { get; set; }

    /// <summary>
    /// Gets or sets the sort order value for UI display prioritization.
    /// </summary>
    public int SortOrder { get; set; }

    #endregion

    #region Constructors

    /// <summary>
    /// Required default constructor for Entity Framework Core.
    /// </summary>
    public Category() : base()
    {
    }

    /// <summary>
    /// Initializes a new instance of the Category class.
    /// </summary>
    public Category(string name, Guid? parentId = null, int sortOrder = 0) : base()
    {
        Name = name;
        ParentId = parentId;
        SortOrder = sortOrder;
    }

    #endregion

    #region Navigation Properties

    /// <summary>
    /// Gets or sets the parent category instance.
    /// </summary>
    public virtual Category? Parent { get; set; }

    /// <summary>
    /// Gets or sets the list of subcategories.
    /// </summary>
    public virtual ICollection<Category> Children { get; set; } = new List<Category>();

    /// <summary>
    /// Gets or sets the collection of products cataloged under this category.
    /// </summary>
    public virtual ICollection<Product> Products { get; set; } = new List<Product>();

    #endregion
}
