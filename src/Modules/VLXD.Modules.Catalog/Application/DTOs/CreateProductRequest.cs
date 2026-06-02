using System;
using System.Collections.Generic;

namespace VLXD.Modules.Catalog.Application.DTOs;

/// <summary>
/// Payload class containing data required to register a new product.
/// </summary>
public record CreateProductRequest(
    string Sku,
    string Name,
    string Description,
    Guid CategoryId,
    decimal BasePrice,
    string UnitOfMeasure,
    decimal? UnitsPerPackage,
    decimal? CoveragePerPackage,
    decimal WastageRate,
    string? ImageUrl,
    List<ProductSpecDto> Specs,
    List<ProductAliasDto> Aliases,
    List<PriceTierDto> PriceTiers
);
