using System;
using System.Collections.Generic;
using VLXD.SharedKernel.Domain;

namespace VLXD.Modules.WMS.Domain.Entities;

/// <summary>
/// Represents a warehouse facility within the logistics system.
/// </summary>
public class Warehouse : Entity
{
    #region Properties

    /// <summary>
    /// Gets the name of the warehouse.
    /// </summary>
    public string Name { get; private set; } = string.Empty;

    /// <summary>
    /// Gets the physical address of the warehouse.
    /// </summary>
    public string Address { get; private set; } = string.Empty;

    #endregion

    #region Navigation Properties

    /// <summary>
    /// Gets the inventory items stored in this warehouse.
    /// </summary>
    public virtual ICollection<InventoryItem> InventoryItems { get; private set; } = new List<InventoryItem>();

    /// <summary>
    /// Gets the stock movements recorded in this warehouse.
    /// </summary>
    public virtual ICollection<StockMovement> StockMovements { get; private set; } = new List<StockMovement>();

    #endregion

    #region Constructors

    /// <summary>
    /// Required constructor for EF Core.
    /// </summary>
    protected Warehouse() { }

    /// <summary>
    /// Initializes a new instance of the Warehouse class.
    /// </summary>
    public Warehouse(string name, string address)
    {
        Name = name ?? throw new ArgumentNullException(nameof(name));
        Address = address ?? throw new ArgumentNullException(nameof(address));
    }

    #endregion

    #region Methods

    /// <summary>
    /// Updates the details of the warehouse.
    /// </summary>
    public void UpdateDetails(string name, string address)
    {
        Name = name ?? throw new ArgumentNullException(nameof(name));
        Address = address ?? throw new ArgumentNullException(nameof(address));
    }

    #endregion
}
