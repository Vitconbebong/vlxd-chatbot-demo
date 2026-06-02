using System;
using System.Collections.Generic;

namespace VLXD.Modules.Sales.Application.DTOs;

/// <summary>
/// Data Transfer Object representing an order line item in responses.
/// </summary>
public record OrderItemDto(
    Guid ProductId,
    string ProductName,
    int Quantity,
    string Unit,
    decimal UnitPrice,
    decimal Subtotal
);

/// <summary>
/// Data Transfer Object representing detailed order details in responses.
/// </summary>
public record OrderDto(
    Guid Id,
    string OrderNumber,
    Guid CustomerId,
    string CustomerName,
    string CustomerPhone,
    string Status,
    decimal TotalAmount,
    string DeliveryAddress,
    string Notes,
    IReadOnlyCollection<OrderItemDto> Items,
    DateTime CreatedAt,
    DateTime? UpdatedAt
);
