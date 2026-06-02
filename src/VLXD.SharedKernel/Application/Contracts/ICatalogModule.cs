using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace VLXD.SharedKernel.Application.Contracts;

/// <summary>
/// Price tier data representation for cross-module integration.
/// </summary>
public record PriceTierContractDto(string TierName, decimal Price, int MinQuantity);

/// <summary>
/// Product specification detail representation for cross-module integration.
/// </summary>
public record ProductContractDto(
    Guid Id,
    string Sku,
    string Name,
    decimal BasePrice,
    string UnitOfMeasure,
    decimal? UnitsPerPackage,
    decimal? CoveragePerPackage,
    decimal WastageRate,
    List<PriceTierContractDto> PriceTiers
);

/// <summary>
/// Data payload for auto-creating a product from an inbound stock receipt.
/// </summary>
public record CreateProductFromInboundDto(
    string Name,
    string Sku,
    string UnitOfMeasure,
    decimal BasePrice,
    Guid CategoryId,
    List<KeyValuePair<string, string>>? Specifications
);

/// <summary>
/// Shared contract for product catalog operations requested by other modules.
/// </summary>
public interface ICatalogModule
{
    #region Methods

    /// <summary>
    /// Retrieves product details by its unique identifier.
    /// </summary>
    Task<ProductContractDto?> GetProductByIdAsync(Guid productId);

    /// <summary>
    /// Retrieves details for a collection of products in a single batch query.
    /// </summary>
    Task<List<ProductContractDto>> GetProductsByIdsAsync(List<Guid> productIds);

    /// <summary>
    /// Executes a search for products matching a query term.
    /// </summary>
    Task<List<ProductContractDto>> SearchProductsAsync(string query);

    /// <summary>
    /// Retrieves the total count of active products.
    /// </summary>
    Task<int> GetProductsCountAsync();

    /// <summary>
    /// Auto-creates a product during WMS inbound receipt when the product details are provided.
    /// </summary>
    Task<Guid> CreateProductFromInboundAsync(CreateProductFromInboundDto dto);

    #endregion
}
