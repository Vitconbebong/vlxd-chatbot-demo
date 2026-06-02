using System;
using System.Collections.Generic;

namespace VLXD.Modules.Sales.Application.DTOs;

/// <summary>
/// Data Transfer Object representing a single parsed quotation item in responses.
/// </summary>
public record QuotationItemDto(
    Guid? MatchedProductId,
    string MatchedProductName,
    string RawItemText,
    int Quantity,
    string Unit,
    decimal UnitPrice,
    decimal ConfidenceScore,
    decimal Subtotal
);

/// <summary>
/// Data Transfer Object representing detailed quotation information in responses.
/// </summary>
public record QuotationDto(
    Guid Id,
    Guid CustomerId,
    string CustomerName,
    string CustomerPhone,
    string SourceText,
    string Status,
    decimal TotalEstimated,
    bool CreatedByAi,
    IReadOnlyCollection<QuotationItemDto> Items,
    DateTime CreatedAt
);
