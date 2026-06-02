using System;

namespace VLXD.Modules.WMS.Application.DTOs;

#region Inventory DTOs

public record InventoryDto(
    Guid Id,
    Guid WarehouseId,
    string WarehouseName,
    Guid ProductId,
    string ProductName,
    decimal QuantityOnHand,
    decimal QuantityReserved,
    decimal QuantityAvailable,
    string BinLocation
);

public record ReceiveStockRequest(
    Guid WarehouseId,
    Guid ProductId,
    decimal Quantity,
    string ReferenceNumber,
    string Notes,
    string BinLocation
);

public record SpecificationInput(string Key, string Value);

public record ReceiveStockWithAutoCreateRequest(
    Guid WarehouseId,
    Guid? ProductId,
    string? ProductName,
    string? ProductSku,
    string? UnitOfMeasure,
    decimal? BasePrice,
    Guid? CategoryId,
    decimal Quantity,
    string ReferenceNumber,
    string Notes,
    string BinLocation,
    System.Collections.Generic.List<SpecificationInput>? Specifications
);

#endregion

#region Warehouse DTOs

public record CreateWarehouseRequest(string Name, string Address);
public record UpdateWarehouseRequest(string Name, string Address);
public record WarehouseDto(Guid Id, string Name, string Address, int InventoryCount, DateTime CreatedAt);

#endregion

#region Delivery DTOs

public record DeliveryOrderDto(
    Guid Id,
    Guid OrderId,
    Guid? VehicleId,
    string DriverName,
    string DriverPhone,
    string PlateNumber,
    string Status,
    string DeliveryAddress,
    DateTime? EstimatedArrival,
    DateTime? ActualArrival,
    string Notes,
    double? CurrentLat,
    double? CurrentLng
);

public record AssignVehicleRequest(Guid VehicleId);

public record UpdateDeliveryStatusRequest(string Status, string? FailureReason);

#endregion

#region Vehicle DTOs

public record VehicleDto(
    Guid Id,
    string PlateNumber,
    string DriverName,
    string DriverPhone,
    double CurrentLat,
    double CurrentLng,
    string CurrentStatus
);

#endregion
