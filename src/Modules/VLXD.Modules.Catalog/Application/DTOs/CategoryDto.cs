using System;
using System.Collections.Generic;

namespace VLXD.Modules.Catalog.Application.DTOs;

/// <summary>
/// Data Transfer Object representing a category, supporting hierarchical layouts.
/// </summary>
public record CategoryDto(
    Guid Id,
    string Name,
    Guid? ParentId,
    int SortOrder,
    IReadOnlyCollection<CategoryDto> Children
);
