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
using VLXD.Modules.WMS.Application.DTOs;
using VLXD.Modules.WMS.Domain.Entities;
using VLXD.Modules.WMS.Domain.Enums;
using VLXD.Modules.WMS.Domain.Interfaces;
using VLXD.Modules.WMS.Infrastructure;
using VLXD.SharedKernel.Application.Contracts;

namespace VLXD.Modules.WMS.Api;

/// <summary>
/// Exposes Warehouse Management System (WMS) minimal API endpoints.
/// </summary>
public static class WmsEndpoints
{
    #region Methods

    /// <summary>
    /// Maps WMS module endpoints to the central route builder.
    /// </summary>
    public static IEndpointRouteBuilder MapWmsEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/wms").WithTags("WMS");

        // Inventory management (Admin/Employee)
        group.MapGet("/inventory", GetInventoryAsync)
            .RequireAuthorization(policy => policy.RequireRole("Admin", "Employee"));

        group.MapPost("/inventory/receive", ReceiveStockAsync)
            .RequireAuthorization(policy => policy.RequireRole("Admin", "Employee"));

        group.MapGet("/inventory/low-stock", GetLowStockInventoryAsync)
            .RequireAuthorization(policy => policy.RequireRole("Admin", "Employee"));

        // Deliveries management
        group.MapGet("/deliveries", GetDeliveriesAsync)
            .RequireAuthorization(policy => policy.RequireRole("Admin", "Employee"));

        group.MapGet("/deliveries/{id:guid}", GetDeliveryByIdAsync)
            .RequireAuthorization();

        group.MapGet("/deliveries/order/{orderId:guid}", GetDeliveryByOrderIdAsync)
            .RequireAuthorization();

        group.MapPut("/deliveries/{id:guid}/assign-vehicle", AssignVehicleAsync)
            .RequireAuthorization(policy => policy.RequireRole("Admin", "Employee"));

        group.MapPut("/deliveries/{id:guid}/status", UpdateDeliveryStatusAsync)
            .RequireAuthorization(policy => policy.RequireRole("Admin", "Employee"));

        // Vehicles list
        group.MapGet("/vehicles", GetVehiclesAsync)
            .RequireAuthorization(policy => policy.RequireRole("Admin", "Employee"));

        // Warehouses CRUD
        group.MapGet("/warehouses", GetWarehousesAsync)
            .RequireAuthorization(policy => policy.RequireRole("Admin", "Employee"));

        group.MapPost("/warehouses", CreateWarehouseAsync)
            .RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapPut("/warehouses/{id:guid}", UpdateWarehouseAsync)
            .RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapDelete("/warehouses/{id:guid}", DeleteWarehouseAsync)
            .RequireAuthorization(policy => policy.RequireRole("Admin"));

        return endpoints;
    }

    #region Endpoint Handlers

    private static async Task<IResult> GetInventoryAsync(
        WmsDbContext db,
        ICatalogModule catalog,
        [FromQuery] Guid? warehouseId)
    {
        var query = db.Inventory.Include(i => i.Warehouse).AsQueryable();

        if (warehouseId.HasValue)
        {
            query = query.Where(i => i.WarehouseId == warehouseId.Value);
        }

        var items = await query.ToListAsync();
        var productIds = items.Select(i => i.ProductId).Distinct().ToList();
        
        var products = productIds.Any()
            ? await catalog.GetProductsByIdsAsync(productIds)
            : new List<ProductContractDto>();
            
        var productDict = products.ToDictionary(p => p.Id, p => p.Name);

        var dtos = items.Select(i => new InventoryDto(
            i.Id,
            i.WarehouseId,
            i.Warehouse?.Name ?? "Unknown Warehouse",
            i.ProductId,
            productDict.TryGetValue(i.ProductId, out var name) ? name : "Unknown Product",
            i.QuantityOnHand,
            i.QuantityReserved,
            i.QuantityAvailable,
            i.BinLocation
        )).ToList();

        return Results.Ok(dtos);
    }

    private static async Task<IResult> ReceiveStockAsync(
        [FromServices] WmsDbContext db,
        [FromServices] ICatalogModule catalog,
        [FromBody] ReceiveStockWithAutoCreateRequest request)
    {
        if (request.Quantity <= 0)
        {
            return Results.BadRequest(new { Message = "Receive quantity must be positive." });
        }

        var warehouse = await db.Warehouses.FindAsync(request.WarehouseId);
        if (warehouse == null)
        {
            return Results.BadRequest(new { Message = "Warehouse not found." });
        }

        Guid productId;
        if (request.ProductId.HasValue)
        {
            var product = await catalog.GetProductByIdAsync(request.ProductId.Value);
            if (product != null)
            {
                productId = product.Id;
            }
            else
            {
                if (string.IsNullOrWhiteSpace(request.ProductName) || string.IsNullOrWhiteSpace(request.ProductSku))
                {
                    return Results.BadRequest(new { Message = $"Product with ID {request.ProductId.Value} does not exist and auto-create information is incomplete." });
                }
                productId = await catalog.CreateProductFromInboundAsync(new CreateProductFromInboundDto(
                    request.ProductName,
                    request.ProductSku,
                    request.UnitOfMeasure ?? "Cái",
                    request.BasePrice ?? 0,
                    request.CategoryId ?? Guid.Empty,
                    request.Specifications?.Select(s => new KeyValuePair<string, string>(s.Key, s.Value)).ToList()
                ));
            }
        }
        else
        {
            if (string.IsNullOrWhiteSpace(request.ProductName) || string.IsNullOrWhiteSpace(request.ProductSku))
            {
                return Results.BadRequest(new { Message = "Product ID was not provided and auto-create fields (ProductName, ProductSku) are missing." });
            }
            productId = await catalog.CreateProductFromInboundAsync(new CreateProductFromInboundDto(
                request.ProductName,
                request.ProductSku,
                request.UnitOfMeasure ?? "Cái",
                request.BasePrice ?? 0,
                request.CategoryId ?? Guid.Empty,
                request.Specifications?.Select(s => new KeyValuePair<string, string>(s.Key, s.Value)).ToList()
            ));
        }

        var inventoryItem = await db.Inventory
            .FirstOrDefaultAsync(i => i.WarehouseId == request.WarehouseId && i.ProductId == productId);

        if (inventoryItem == null)
        {
            // Create a new inventory record if it doesn't exist in the warehouse
            inventoryItem = new InventoryItem(request.WarehouseId, productId, request.Quantity, request.BinLocation);
            db.Inventory.Add(inventoryItem);
        }
        else
        {
            inventoryItem.ReceiveStock(request.Quantity);
            if (!string.IsNullOrEmpty(request.BinLocation))
            {
                inventoryItem.UpdateBinLocation(request.BinLocation);
            }
        }

        var movement = new StockMovement(
            request.WarehouseId,
            productId,
            MovementType.Inbound,
            request.Quantity,
            request.ReferenceNumber ?? "RCV-SYSTEM",
            request.Notes ?? "Manual inventory inbound receipt"
        );

        db.StockMovements.Add(movement);

        await db.SaveChangesAsync();

        return Results.Ok(new { Message = "Stock successfully received.", ProductId = productId, NewQuantityOnHand = inventoryItem.QuantityOnHand });
    }

    private static async Task<IResult> GetLowStockInventoryAsync(
        WmsDbContext db,
        ICatalogModule catalog)
    {
        const decimal threshold = 10m;
        
        var lowStockItems = await db.Inventory
            .Include(i => i.Warehouse)
            .Where(i => (i.QuantityOnHand - i.QuantityReserved) < threshold)
            .ToListAsync();

        var productIds = lowStockItems.Select(i => i.ProductId).Distinct().ToList();
        var products = productIds.Any()
            ? await catalog.GetProductsByIdsAsync(productIds)
            : new List<ProductContractDto>();
        var productDict = products.ToDictionary(p => p.Id, p => p.Name);

        var dtos = lowStockItems.Select(i => new InventoryDto(
            i.Id,
            i.WarehouseId,
            i.Warehouse?.Name ?? "Unknown Warehouse",
            i.ProductId,
            productDict.TryGetValue(i.ProductId, out var name) ? name : "Unknown Product",
            i.QuantityOnHand,
            i.QuantityReserved,
            i.QuantityAvailable,
            i.BinLocation
        )).ToList();

        return Results.Ok(dtos);
    }

    private static async Task<IResult> GetDeliveriesAsync(WmsDbContext db)
    {
        var deliveries = await db.DeliveryOrders
            .Include(d => d.Vehicle)
            .OrderByDescending(d => d.CreatedAt)
            .ToListAsync();

        var dtos = deliveries.Select(d => MapToDeliveryDto(d, null)).ToList();
        return Results.Ok(dtos);
    }

    private static async Task<IResult> GetDeliveryByIdAsync(
        WmsDbContext db,
        IDeliveryTracker tracker,
        Guid id)
    {
        var delivery = await db.DeliveryOrders
            .Include(d => d.Vehicle)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (delivery == null)
        {
            return Results.NotFound(new { Message = $"Delivery order with ID {id} not found." });
        }

        (double? lat, double? lng) = (null, null);
        if (delivery.VehicleId.HasValue && delivery.Status == DeliveryStatus.InTransit)
        {
            var coords = tracker.GetCurrentLocation(delivery.VehicleId.Value);
            lat = coords.Latitude;
            lng = coords.Longitude;
        }

        return Results.Ok(MapToDeliveryDto(delivery, lat, lng));
    }

    private static async Task<IResult> GetDeliveryByOrderIdAsync(
        WmsDbContext db,
        IDeliveryTracker tracker,
        Guid orderId)
    {
        var delivery = await db.DeliveryOrders
            .Include(d => d.Vehicle)
            .FirstOrDefaultAsync(d => d.OrderId == orderId);

        if (delivery == null)
        {
            return Results.NotFound(new { Message = $"Delivery details for Order {orderId} not found." });
        }

        (double? lat, double? lng) = (null, null);
        if (delivery.VehicleId.HasValue && delivery.Status == DeliveryStatus.InTransit)
        {
            var coords = tracker.GetCurrentLocation(delivery.VehicleId.Value);
            lat = coords.Latitude;
            lng = coords.Longitude;
        }

        return Results.Ok(MapToDeliveryDto(delivery, lat, lng));
    }

    private static async Task<IResult> AssignVehicleAsync(
        WmsDbContext db,
        Guid id,
        [FromBody] AssignVehicleRequest request)
    {
        var delivery = await db.DeliveryOrders.FindAsync(id);
        if (delivery == null)
        {
            return Results.NotFound(new { Message = "Delivery order not found." });
        }

        var vehicle = await db.Vehicles.FindAsync(request.VehicleId);
        if (vehicle == null)
        {
            return Results.BadRequest(new { Message = "Vehicle not found." });
        }

        if (vehicle.CurrentStatus == "Maintenance")
        {
            return Results.BadRequest(new { Message = "Vehicle is currently under maintenance and cannot be assigned." });
        }

        try
        {
            delivery.AssignVehicle(vehicle.Id);
            vehicle.UpdateStatus("OnDelivery");

            await db.SaveChangesAsync();
            return Results.Ok(MapToDeliveryDto(delivery, null));
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(new { Message = ex.Message });
        }
    }

    private static async Task<IResult> UpdateDeliveryStatusAsync(
        WmsDbContext db,
        ISmsNotifier smsNotifier,
        Guid id,
        [FromBody] UpdateDeliveryStatusRequest request)
    {
        var delivery = await db.DeliveryOrders
            .Include(d => d.Vehicle)
            .FirstOrDefaultAsync(d => d.Id == id);

        if (delivery == null)
        {
            return Results.NotFound(new { Message = "Delivery order not found." });
        }

        try
        {
            switch (request.Status.ToLowerInvariant())
            {
                case "intransit":
                    delivery.StartTransit();
                    if (delivery.Vehicle != null)
                    {
                        await smsNotifier.SendSmsAsync(
                            delivery.Vehicle.DriverPhone,
                            $"Bắt đầu giao đơn hàng tại địa chỉ: {delivery.DeliveryAddress}. Tài xế: {delivery.Vehicle.DriverName}");
                    }
                    break;
                case "delivered":
                    delivery.CompleteDelivery();
                    if (delivery.Vehicle != null)
                    {
                        delivery.Vehicle.UpdateStatus("Available");
                    }
                    break;
                case "failed":
                    delivery.FailDelivery(request.FailureReason ?? "Unknown issue");
                    if (delivery.Vehicle != null)
                    {
                        delivery.Vehicle.UpdateStatus("Available");
                    }
                    break;
                default:
                    return Results.BadRequest(new { Message = $"Invalid status transition '{request.Status}'." });
            }

            await db.SaveChangesAsync();
            return Results.Ok(MapToDeliveryDto(delivery, null));
        }
        catch (InvalidOperationException ex)
        {
            return Results.BadRequest(new { Message = ex.Message });
        }
    }

    private static async Task<IResult> GetVehiclesAsync(WmsDbContext db)
    {
        var vehicles = await db.Vehicles
            .OrderBy(v => v.PlateNumber)
            .ToListAsync();

        var dtos = vehicles.Select(v => new VehicleDto(
            v.Id,
            v.PlateNumber,
            v.DriverName,
            v.DriverPhone,
            v.CurrentLat,
            v.CurrentLng,
            v.CurrentStatus
        )).ToList();

        return Results.Ok(dtos);
    }

    #endregion

    #region Helpers

    private static DeliveryOrderDto MapToDeliveryDto(DeliveryOrder d, double? lat = null, double? lng = null)
    {
        return new DeliveryOrderDto(
            d.Id,
            d.OrderId,
            d.VehicleId,
            d.Vehicle?.DriverName ?? "Not Assigned",
            d.Vehicle?.DriverPhone ?? "N/A",
            d.Vehicle?.PlateNumber ?? "N/A",
            d.Status.ToString(),
            d.DeliveryAddress,
            d.EstimatedArrival,
            d.ActualArrival,
            d.Notes,
            lat,
            lng
        );
    }

    private static async Task<IResult> GetWarehousesAsync(
        [FromServices] WmsDbContext db)
    {
        var warehouses = await db.Warehouses
            .Include(w => w.InventoryItems)
            .OrderBy(w => w.Name)
            .ToListAsync();

        var dtos = warehouses.Select(w => new WarehouseDto(
            w.Id,
            w.Name,
            w.Address,
            w.InventoryItems.Count,
            w.CreatedAt
        )).ToList();

        return Results.Ok(dtos);
    }

    private static async Task<IResult> CreateWarehouseAsync(
        [FromServices] WmsDbContext db,
        [FromBody] CreateWarehouseRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Results.BadRequest(new { Message = "Tên kho không được để trống." });
        }
        if (string.IsNullOrWhiteSpace(request.Address))
        {
            return Results.BadRequest(new { Message = "Địa chỉ kho không được để trống." });
        }

        var warehouse = new Warehouse(request.Name, request.Address);
        db.Warehouses.Add(warehouse);
        await db.SaveChangesAsync();

        return Results.Created($"/api/wms/warehouses/{warehouse.Id}", new WarehouseDto(
            warehouse.Id,
            warehouse.Name,
            warehouse.Address,
            0,
            warehouse.CreatedAt
        ));
    }

    private static async Task<IResult> UpdateWarehouseAsync(
        [FromServices] WmsDbContext db,
        [FromRoute] Guid id,
        [FromBody] UpdateWarehouseRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return Results.BadRequest(new { Message = "Tên kho không được để trống." });
        }
        if (string.IsNullOrWhiteSpace(request.Address))
        {
            return Results.BadRequest(new { Message = "Địa chỉ kho không được để trống." });
        }

        var warehouse = await db.Warehouses.FindAsync(id);
        if (warehouse == null)
        {
            return Results.NotFound(new { Message = $"Warehouse with ID {id} not found." });
        }

        warehouse.UpdateDetails(request.Name, request.Address);
        await db.SaveChangesAsync();

        var inventoryCount = await db.Inventory.CountAsync(i => i.WarehouseId == id);

        return Results.Ok(new WarehouseDto(
            warehouse.Id,
            warehouse.Name,
            warehouse.Address,
            inventoryCount,
            warehouse.CreatedAt
        ));
    }

    private static async Task<IResult> DeleteWarehouseAsync(
        [FromServices] WmsDbContext db,
        [FromRoute] Guid id)
    {
        var warehouse = await db.Warehouses.FindAsync(id);
        if (warehouse == null)
        {
            return Results.NotFound(new { Message = $"Warehouse with ID {id} not found." });
        }

        var hasInventory = await db.Inventory.AnyAsync(i => i.WarehouseId == id && i.QuantityOnHand > 0);
        if (hasInventory)
        {
            return Results.BadRequest(new { Message = "Không thể xóa kho khi vẫn còn hàng tồn." });
        }

        var emptyInventoryItems = await db.Inventory.Where(i => i.WarehouseId == id).ToListAsync();
        db.Inventory.RemoveRange(emptyInventoryItems);

        var movements = await db.StockMovements.Where(sm => sm.WarehouseId == id).ToListAsync();
        db.StockMovements.RemoveRange(movements);

        db.Warehouses.Remove(warehouse);
        await db.SaveChangesAsync();

        return Results.NoContent();
    }

    #endregion

    #endregion
}
