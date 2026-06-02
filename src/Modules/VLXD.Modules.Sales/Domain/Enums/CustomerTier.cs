namespace VLXD.Modules.Sales.Domain.Enums;

/// <summary>
/// Defines client tiers that govern price calculations and priority levels.
/// </summary>
public enum CustomerTier
{
    /// <summary>
    /// B2C standard retail customer, no discount.
    /// </summary>
    Retail,

    /// <summary>
    /// B2B contractor, standard 8% discount.
    /// </summary>
    Contractor,

    /// <summary>
    /// B2B dealer/distributor, standard 15% discount.
    /// </summary>
    Dealer
}
