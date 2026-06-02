using System.Collections.Generic;

namespace VLXD.Modules.Sales.Application.DTOs;

/// <summary>
/// Data Transfer Object representing daily revenue totals.
/// </summary>
public record DailyRevenueDto(string Date, decimal Revenue);

/// <summary>
/// Data Transfer Object representing top-selling products.
/// </summary>
public record TopProductDto(string Sku, string ProductName, int QuantitySold, decimal Revenue);

/// <summary>
/// Data Transfer Object returning comprehensive dashboard statistics.
/// </summary>
public record DashboardStatsDto(
    decimal TotalRevenue,
    int OrderCount,
    int ProductsCount,
    int LowStockCount,
    List<DailyRevenueDto> RevenueLast7Days,
    List<TopProductDto> TopProducts
);
