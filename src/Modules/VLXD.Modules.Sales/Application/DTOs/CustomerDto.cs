using System;

namespace VLXD.Modules.Sales.Application.DTOs;

/// <summary>
/// Data Transfer Object representing customer details.
/// </summary>
public record CustomerDto(
    Guid Id,
    string Name,
    string Phone,
    string Email,
    string Address,
    string Tier
);
