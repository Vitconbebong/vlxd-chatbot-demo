using System;

namespace VLXD.Modules.Catalog.Application.DTOs;

/// <summary>
/// Payload class containing data required to register a new category.
/// </summary>
public record CreateCategoryRequest(
    string Name,
    Guid? ParentId,
    int SortOrder
);

/// <summary>
/// Payload class containing data required to update an existing category.
/// </summary>
public record UpdateCategoryRequest(
    string Name,
    Guid? ParentId,
    int SortOrder
);
