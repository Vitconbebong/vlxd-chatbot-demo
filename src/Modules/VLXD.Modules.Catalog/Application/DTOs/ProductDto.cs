using System;
using System.Collections.Generic;

namespace VLXD.Modules.Catalog.Application.DTOs;

/// <summary>
/// Data Transfer Object representing a product specification.
/// </summary>
public record ProductSpecDto(string SpecKey, string SpecValue);

/// <summary>
/// Data Transfer Object representing a product alias.
/// </summary>
public record ProductAliasDto(string AliasName);

/// <summary>
/// Data Transfer Object representing a pricing tier.
/// </summary>
public record PriceTierDto(string TierName, decimal Price, int MinQuantity);

/// <summary>
/// Data Transfer Object representing detailed product information.
/// </summary>
public record ProductDto(
    Guid Id,
    string Sku,
    string Name,
    string Description,
    Guid CategoryId,
    string CategoryName,
    decimal BasePrice,
    string UnitOfMeasure,
    decimal? UnitsPerPackage,
    decimal? CoveragePerPackage,
    decimal WastageRate,
    string? ImageUrl,
    bool IsActive,
    IReadOnlyCollection<ProductSpecDto> Specs,
    IReadOnlyCollection<ProductAliasDto> Aliases,
    IReadOnlyCollection<PriceTierDto> PriceTiers,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);
