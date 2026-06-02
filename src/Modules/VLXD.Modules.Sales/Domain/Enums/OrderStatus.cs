namespace VLXD.Modules.Sales.Domain.Enums;

/// <summary>
/// Defines the lifecycle states of a customer order.
/// </summary>
public enum OrderStatus
{
    /// <summary>
    /// Order is created but not yet verified or paid.
    /// </summary>
    Draft,

    /// <summary>
    /// Order has been confirmed and inventory has been reserved.
    /// </summary>
    Confirmed,

    /// <summary>
    /// Order has been dispatched and is currently in transit.
    /// </summary>
    Delivering,

    /// <summary>
    /// Order has been safely received by the customer.
    /// </summary>
    Completed,

    /// <summary>
    /// Order has been revoked and inventory reservations cleared.
    /// </summary>
    Cancelled
}
