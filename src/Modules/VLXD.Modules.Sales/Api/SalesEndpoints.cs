using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using VLXD.Modules.Sales.Application.DTOs;
using VLXD.Modules.Sales.Domain.Entities;
using VLXD.Modules.Sales.Domain.Enums;
using VLXD.Modules.Sales.Infrastructure;
using VLXD.SharedKernel.Application;
using VLXD.SharedKernel.Application.Contracts;

namespace VLXD.Modules.Sales.Api;

/// <summary>
/// Exposes Sales module REST endpoints via Minimal APIs.
/// </summary>
public static class SalesEndpoints
{
    #region Methods

    /// <summary>
    /// Maps sales endpoints to the main routing table.
    /// </summary>
    public static IEndpointRouteBuilder MapSalesEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/sales").WithTags("Sales");

        // Order processing (requires authentication)
        group.MapPost("/orders", PlaceOrderAsync)
            .RequireAuthorization();
            
        group.MapGet("/orders", GetOrdersAsync)
            .RequireAuthorization();
            
        group.MapGet("/orders/{id:guid}", GetOrderByIdAsync)
            .RequireAuthorization();

        group.MapPut("/orders/{id:guid}/status", UpdateOrderStatusAsync)
            .RequireAuthorization(policy => policy.RequireRole("Admin", "Employee"));

        // Customer lists (Admin/Employee only)
        group.MapGet("/customers", GetCustomersAsync)
            .RequireAuthorization(policy => policy.RequireRole("Admin", "Employee"));

        // Dashboard statistics
        group.MapGet("/dashboard", GetDashboardStatsAsync)
            .RequireAuthorization(policy => policy.RequireRole("Admin", "Employee"));

        // Quotations list and approvals
        group.MapGet("/quotations", GetQuotationsAsync)
            .RequireAuthorization(policy => policy.RequireRole("Admin", "Employee"));
            
        group.MapPost("/quotations/{id:guid}/approve", ApproveQuotationAsync)
            .RequireAuthorization(policy => policy.RequireRole("Admin", "Employee"));

        return endpoints;
    }

    #region Endpoint Handlers

    private static async Task<IResult> PlaceOrderAsync(
        [FromServices] SalesDbContext db,
        [FromServices] ICatalogModule catalog,
        ClaimsPrincipal user,
        [FromBody] PlaceOrderRequest request)
    {
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Results.Unauthorized();
        }

        var customer = await db.Customers.FirstOrDefaultAsync(c => c.UserId == userId);
        if (customer == null)
        {
            return Results.BadRequest(new { Message = "Customer profile not found for this user account." });
        }

        if (request.Items == null || !request.Items.Any())
        {
            return Results.BadRequest(new { Message = "Order must contain at least one item." });
        }

        // Fetch catalog items to resolve names and standard prices
        var productIds = request.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await catalog.GetProductsByIdsAsync(productIds);
        var productDict = products.ToDictionary(p => p.Id);

        foreach (var id in productIds)
        {
            if (!productDict.ContainsKey(id))
            {
                return Results.BadRequest(new { Message = $"Product with ID {id} is not registered in the catalog." });
            }
        }

        // Generate unique order number (format: ORD-YYYYMMDD-XXXX)
        var todayStr = DateTime.UtcNow.ToString("yyyyMMdd");
        var todayOrderCount = await db.Orders.CountAsync(o => o.OrderNumber.StartsWith($"ORD-{todayStr}"));
        var sequence = (todayOrderCount + 1).ToString("D4");
        var orderNumber = $"ORD-{todayStr}-{sequence}";

        var order = new Order(customer.Id, orderNumber, request.DeliveryAddress, request.Notes);

        // Apply price discount tags based on Customer Tier matching
        foreach (var item in request.Items)
        {
            var product = productDict[item.ProductId];
            
            var tierStr = customer.Tier.ToString();
            var tierPrice = product.PriceTiers.FirstOrDefault(t => t.TierName.Equals(tierStr, StringComparison.OrdinalIgnoreCase));
            var price = tierPrice?.Price ?? product.BasePrice;

            order.AddItem(product.Id, product.Name, item.Quantity, product.UnitOfMeasure, price);
        }

        // Move to Confirmed state which triggers the OrderPlacedEvent for inventory reservation
        order.Confirm();

        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var savedOrder = await db.Orders
            .Include(o => o.Customer)
            .Include(o => o.Items)
            .FirstAsync(o => o.Id == order.Id);

        return Results.Created($"/api/sales/orders/{order.Id}", MapToOrderDto(savedOrder));
    }

    private static async Task<IResult> GetOrdersAsync(
        [FromServices] SalesDbContext db,
        ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Results.Unauthorized();
        }

        var isStaff = user.IsInRole("Admin") || user.IsInRole("Employee");
        
        var query = db.Orders
            .Include(o => o.Customer)
            .Include(o => o.Items)
            .AsQueryable();

        if (!isStaff)
        {
            // Customers can only see their own order history
            var customer = await db.Customers.FirstOrDefaultAsync(c => c.UserId == userId);
            if (customer == null)
            {
                return Results.Ok(new List<OrderDto>());
            }
            query = query.Where(o => o.CustomerId == customer.Id);
        }

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        var dtos = orders.Select(MapToOrderDto).ToList();
        return Results.Ok(dtos);
    }

    private static async Task<IResult> GetOrderByIdAsync(
        [FromServices] SalesDbContext db,
        ClaimsPrincipal user,
        Guid id)
    {
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Results.Unauthorized();
        }

        var order = await db.Orders
            .Include(o => o.Customer)
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
        {
            return Results.NotFound(new { Message = $"Order with ID {id} not found." });
        }

        // Validate security access
        var isStaff = user.IsInRole("Admin") || user.IsInRole("Employee");
        if (!isStaff)
        {
            var customer = await db.Customers.FirstOrDefaultAsync(c => c.UserId == userId);
            if (customer == null || order.CustomerId != customer.Id)
            {
                return Results.Forbid();
            }
        }

        return Results.Ok(MapToOrderDto(order));
    }

    private static async Task<IResult> UpdateOrderStatusAsync(
        [FromServices] SalesDbContext db,
        Guid id,
        [FromBody] UpdateStatusRequest request)
    {
        var order = await db.Orders
            .Include(o => o.Customer)
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null)
        {
            return Results.NotFound(new { Message = $"Order with ID {id} not found." });
        }

        try
        {
            switch (request.Status.ToLowerInvariant())
            {
                case "confirmed":
                    order.Confirm();
                    break;
                case "delivering":
                    order.StartDelivery();
                    break;
                case "completed":
                    order.Complete();
                    break;
                case "cancelled":
                    order.Cancel();
                    break;
                default:
                    return Results.BadRequest(new { Message = $"Invalid status '{request.Status}'." });
            }

            await db.SaveChangesAsync();
            return Results.Ok(MapToOrderDto(order));
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(new { Message = ex.Message });
        }
    }

    private static async Task<IResult> GetCustomersAsync([FromServices] SalesDbContext db)
    {
        var customers = await db.Customers
            .OrderBy(c => c.Name)
            .ToListAsync();

        var dtos = customers.Select(MapToCustomerDto).ToList();
        return Results.Ok(dtos);
    }

    private static async Task<IResult> GetDashboardStatsAsync(
        [FromServices] SalesDbContext db,
        [FromServices] ICatalogModule catalog,
        [FromServices] IWmsModule wms)
    {
        var activeOrders = await db.Orders
            .Where(o => o.Status == OrderStatus.Confirmed || 
                        o.Status == OrderStatus.Delivering || 
                        o.Status == OrderStatus.Completed)
            .ToListAsync();

        var totalRevenue = activeOrders.Sum(o => o.TotalAmount);
        var orderCount = await db.Orders.CountAsync();

        // Cross-module query count operations
        var productsCount = await catalog.GetProductsCountAsync();
        var lowStockCount = await wms.GetLowStockCountAsync();

        // Calculate Daily Revenue over the last 7 days
        var dailyRevenues = new List<DailyRevenueDto>();
        for (int i = 6; i >= 0; i--)
        {
            var date = DateTime.UtcNow.Date.AddDays(-i);
            var dateStr = date.ToString("yyyy-MM-dd");
            var dayRevenue = activeOrders
                .Where(o => o.CreatedAt.Date == date)
                .Sum(o => o.TotalAmount);

            dailyRevenues.Add(new DailyRevenueDto(dateStr, dayRevenue));
        }

        // Get Top 5 products sold
        var topProductItems = await db.OrderItems
            .Include(oi => oi.Order)
            .Where(oi => oi.Order!.Status == OrderStatus.Confirmed || 
                         oi.Order.Status == OrderStatus.Delivering || 
                         oi.Order.Status == OrderStatus.Completed)
            .GroupBy(oi => new { oi.ProductId, oi.ProductName })
            .Select(g => new
            {
                ProductId = g.Key.ProductId,
                ProductName = g.Key.ProductName,
                QuantitySold = g.Sum(x => x.Quantity),
                Revenue = g.Sum(x => x.Quantity * x.UnitPrice)
            })
            .OrderByDescending(x => x.Revenue)
            .Take(5)
            .ToListAsync();

        var topProductIds = topProductItems.Select(x => x.ProductId).ToList();
        var catalogProducts = topProductIds.Any()
            ? await catalog.GetProductsByIdsAsync(topProductIds)
            : new List<ProductContractDto>();
        var skuDict = catalogProducts.ToDictionary(p => p.Id, p => p.Sku);

        var topProducts = topProductItems.Select(x => new TopProductDto(
            Sku: skuDict.TryGetValue(x.ProductId, out var sku) ? sku : "VLXD-UNKN",
            ProductName: x.ProductName,
            QuantitySold: x.QuantitySold,
            Revenue: x.Revenue
        )).ToList();

        return Results.Ok(new DashboardStatsDto(
            TotalRevenue: totalRevenue,
            OrderCount: orderCount,
            ProductsCount: productsCount,
            LowStockCount: lowStockCount,
            RevenueLast7Days: dailyRevenues,
            TopProducts: topProducts
        ));
    }

    private static async Task<IResult> GetQuotationsAsync(
        [FromServices] SalesDbContext db,
        [FromServices] ICatalogModule catalog)
    {
        var quotations = await db.Quotations
            .Include(q => q.Customer)
            .Include(q => q.Items)
            .OrderByDescending(q => q.CreatedAt)
            .ToListAsync();

        var dtos = new List<QuotationDto>();
        foreach (var q in quotations)
        {
            dtos.Add(await MapToQuotationDtoAsync(q, catalog));
        }

        return Results.Ok(dtos);
    }

    private static async Task<IResult> ApproveQuotationAsync(
        [FromServices] SalesDbContext db,
        [FromServices] ICatalogModule catalog,
        Guid id)
    {
        var quotation = await db.Quotations
            .Include(q => q.Customer)
            .Include(q => q.Items)
            .FirstOrDefaultAsync(q => q.Id == id);

        if (quotation == null)
        {
            return Results.NotFound(new { Message = $"Quotation with ID {id} not found." });
        }

        if (quotation.Status != "Draft")
        {
            return Results.BadRequest(new { Message = $"Quotation is already finalized as '{quotation.Status}'." });
        }

        // Approve the quotation
        quotation.Approve();

        // Create an Order from this Quotation
        var todayStr = DateTime.UtcNow.ToString("yyyyMMdd");
        var todayOrderCount = await db.Orders.CountAsync(o => o.OrderNumber.StartsWith($"ORD-{todayStr}"));
        var sequence = (todayOrderCount + 1).ToString("D4");
        var orderNumber = $"ORD-{todayStr}-{sequence}";

        var order = new Order(
            quotation.CustomerId, 
            orderNumber, 
            quotation.Customer?.Address ?? string.Empty, 
            "Đơn hàng được tạo tự động từ báo giá đã duyệt."
        );

        // Fetch matched products details from Catalog
        var productIds = quotation.Items
            .Where(i => i.MatchedProductId.HasValue)
            .Select(i => i.MatchedProductId!.Value)
            .Distinct()
            .ToList();

        var products = productIds.Any()
            ? await catalog.GetProductsByIdsAsync(productIds)
            : new List<ProductContractDto>();

        var productDict = products.ToDictionary(p => p.Id);

        foreach (var item in quotation.Items)
        {
            if (item.MatchedProductId.HasValue && productDict.TryGetValue(item.MatchedProductId.Value, out var product))
            {
                order.AddItem(product.Id, product.Name, item.Quantity, product.UnitOfMeasure, item.UnitPrice);
            }
        }

        order.Confirm();
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        return Results.Ok(MapToOrderDto(order));
    }

    #endregion

    #region Mapping Helpers

    private static OrderDto MapToOrderDto(Order o)
    {
        return new OrderDto(
            o.Id,
            o.OrderNumber,
            o.CustomerId,
            o.Customer?.Name ?? "Unknown",
            o.Customer?.Phone ?? "Unknown",
            o.Status.ToString(),
            o.TotalAmount,
            o.DeliveryAddress,
            o.Notes,
            o.Items.Select(i => new OrderItemDto(
                i.ProductId,
                i.ProductName,
                i.Quantity,
                i.Unit,
                i.UnitPrice,
                i.Subtotal
            )).ToList().AsReadOnly(),
            o.CreatedAt,
            o.UpdatedAt
        );
    }

    private static CustomerDto MapToCustomerDto(Customer c)
    {
        return new CustomerDto(
            c.Id,
            c.Name,
            c.Phone,
            c.Email,
            c.Address,
            c.Tier.ToString()
        );
    }

    private static async Task<QuotationDto> MapToQuotationDtoAsync(Quotation q, ICatalogModule catalogModule)
    {
        var matchedProductIds = q.Items
            .Where(i => i.MatchedProductId.HasValue)
            .Select(i => i.MatchedProductId!.Value)
            .Distinct()
            .ToList();

        var products = matchedProductIds.Any()
            ? await catalogModule.GetProductsByIdsAsync(matchedProductIds)
            : new List<ProductContractDto>();

        var productDict = products.ToDictionary(p => p.Id, p => p.Name);

        var items = q.Items.Select(i => new QuotationItemDto(
            i.MatchedProductId,
            i.MatchedProductId.HasValue && productDict.TryGetValue(i.MatchedProductId.Value, out var name) ? name : "Chưa khớp",
            i.RawItemText,
            i.Quantity,
            i.Unit,
            i.UnitPrice,
            i.ConfidenceScore,
            i.Subtotal
        )).ToList();

        return new QuotationDto(
            q.Id,
            q.CustomerId,
            q.Customer?.Name ?? "Unknown",
            q.Customer?.Phone ?? "Unknown",
            q.SourceText,
            q.Status,
            q.TotalEstimated,
            q.CreatedByAi,
            items.AsReadOnly(),
            q.CreatedAt
        );
    }

    #endregion

    #endregion
}

#region Helper Requests

/// <summary>
/// Status update payload request.
/// </summary>
public record UpdateStatusRequest(string Status);

#endregion
