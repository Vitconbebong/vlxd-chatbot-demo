using System;
using System.Collections.Generic;

namespace VLXD.Modules.Sales.Application.DTOs;

/// <summary>
/// Data Transfer Object representing an item in a new order request.
/// </summary>
public record PlaceOrderItem(Guid ProductId, int Quantity);

/// <summary>
/// Payload class containing information to place a new order.
/// </summary>
public record PlaceOrderRequest(
    string DeliveryAddress,
    string Notes,
    List<PlaceOrderItem> Items
);
