namespace VLXD.Modules.WMS.Domain.Enums;

/// <summary>
/// Defines the lifecycle status of a delivery order.
/// </summary>
public enum DeliveryStatus
{
    Pending,
    Dispatched,
    InTransit,
    Delivered,
    Failed
}
