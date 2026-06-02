using System;
using System.Linq;
using VLXD.SharedKernel.Application.Contracts;

namespace VLXD.Modules.AI.Application.Services;

/// <summary>
/// Result object containing calculated material quantities, costs, and wastage metrics.
/// </summary>
public record MaterialCalculationResult(
    int PackagesNeeded,
    decimal TotalQuantity,
    decimal TotalCost,
    decimal WastageApplied,
    string ErrorMessage = ""
);

/// <summary>
/// Service responsible for performing estimation calculations for construction materials based on area coverage and wastage parameters.
/// </summary>
public class MaterialCalculator
{
    #region Methods

    /// <summary>
    /// Calculates the required quantity and total price of a product for a specific area.
    /// </summary>
    public MaterialCalculationResult CalculateNeededMaterial(
        ProductContractDto product,
        decimal area,
        string customerTier = "Retail")
    {
        if (product == null)
        {
            return new MaterialCalculationResult(0, 0, 0, 0, "Sản phẩm không hợp lệ.");
        }

        // Validate if product supports coverage calculations (tiles, paint, waterproofing)
        if (!product.CoveragePerPackage.HasValue || product.CoveragePerPackage.Value <= 0)
        {
            return new MaterialCalculationResult(
                0, 
                0, 
                0, 
                0, 
                $"Sản phẩm {product.Name} không được bán theo định mức diện tích phủ. Vui lòng hỏi trực tiếp số lượng.");
        }

        decimal coveragePerPackage = product.CoveragePerPackage.Value;
        decimal wastageRate = product.WastageRate;

        // Formula: adjustedArea = area * (1 + wastageRate)
        decimal adjustedArea = area * (1 + wastageRate);
        
        // Number of packages = Ceiling(adjustedArea / coveragePerPackage)
        int packagesNeeded = (int)Math.Ceiling(adjustedArea / coveragePerPackage);
        if (packagesNeeded <= 0)
        {
            packagesNeeded = 1;
        }

        // Calculate total raw units if units per package is defined
        decimal totalUnits = packagesNeeded;
        if (product.UnitsPerPackage.HasValue)
        {
            totalUnits = packagesNeeded * product.UnitsPerPackage.Value;
        }

        // Resolve unit price based on user tier and volume
        decimal unitPrice = ResolvePrice(product, packagesNeeded, customerTier);
        decimal totalCost = packagesNeeded * unitPrice;

        return new MaterialCalculationResult(
            packagesNeeded,
            totalUnits,
            totalCost,
            wastageRate,
            string.Empty
        );
    }

    #region Helpers

    /// <summary>
    /// Resolves the unit price based on the quantity ordered and the user's tier.
    /// </summary>
    private static decimal ResolvePrice(ProductContractDto p, int quantity, string tierName)
    {
        if (p.PriceTiers == null || p.PriceTiers.Count == 0)
        {
            return p.BasePrice;
        }

        // Check if there is a tier matching the user's tier with quantity threshold met
        var tierPrice = p.PriceTiers
            .Where(t => t.TierName.Equals(tierName, StringComparison.OrdinalIgnoreCase) && quantity >= t.MinQuantity)
            .OrderByDescending(t => t.MinQuantity)
            .FirstOrDefault();

        // If no quantity threshold tier is found for their specific role, check if there's a generic one for their role
        if (tierPrice == null)
        {
            tierPrice = p.PriceTiers
                .Where(t => t.TierName.Equals(tierName, StringComparison.OrdinalIgnoreCase) && t.MinQuantity <= 1)
                .FirstOrDefault();
        }

        return tierPrice?.Price ?? p.BasePrice;
    }

    #endregion

    #endregion
}
