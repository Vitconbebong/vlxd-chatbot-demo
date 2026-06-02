using Microsoft.AspNetCore.Identity;

namespace VLXD.Host.Auth;

/// <summary>
/// Represents the user identity in the system, extending the default IdentityUser.
/// </summary>
public class ApplicationUser : IdentityUser
{
    #region Properties

    /// <summary>
    /// Gets or sets the user's full name.
    /// </summary>
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the customer tier (e.g., "Retail", "Contractor", "Dealer").
    /// Null for internal staff like Admins and Employees.
    /// </summary>
    public string? CustomerTier { get; set; }

    #endregion
}
