using System;
using VLXD.Modules.Sales.Domain.Enums;
using VLXD.SharedKernel.Domain;

namespace VLXD.Modules.Sales.Domain.Entities;

/// <summary>
/// Represents a customer entity inside the Sales module boundary.
/// </summary>
public class Customer : Entity
{
    #region Properties

    /// <summary>
    /// Gets or sets the customer full name.
    /// </summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the primary phone number (acts as a unique index).
    /// </summary>
    public string Phone { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the email address.
    /// </summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the primary delivery address.
    /// </summary>
    public string Address { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the pricing tier rating for standard discounts.
    /// </summary>
    public CustomerTier Tier { get; set; } = CustomerTier.Retail;

    /// <summary>
    /// Gets or sets the link to the corresponding ASP.NET Core Identity user ID.
    /// </summary>
    public Guid UserId { get; set; }

    #endregion

    #region Constructors

    /// <summary>
    /// Required default constructor for Entity Framework Core.
    /// </summary>
    public Customer() : base()
    {
    }

    /// <summary>
    /// Initializes a new instance of the Customer class.
    /// </summary>
    public Customer(Guid id, string name, string phone, string email, string address, CustomerTier tier, Guid userId)
        : base(id)
    {
        Name = name;
        Phone = phone;
        Email = email;
        Address = address;
        Tier = tier;
        UserId = userId;
    }

    #endregion
}
