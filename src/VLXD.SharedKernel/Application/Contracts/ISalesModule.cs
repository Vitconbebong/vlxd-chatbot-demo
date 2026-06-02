using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace VLXD.SharedKernel.Application.Contracts;

/// <summary>
/// Quotation item representation for cross-module integration.
/// </summary>
public record QuotationItemContractDto(
    Guid? MatchedProductId,
    string RawItemText,
    int Quantity,
    string Unit,
    decimal UnitPrice,
    decimal ConfidenceScore
);

/// <summary>
/// Shared contract for sales and ordering operations requested by other modules.
/// </summary>
public interface ISalesModule
{
    #region Methods

    /// <summary>
    /// Creates a draft quotation extracted by AI for customer review.
    /// </summary>
    Task<Guid> CreateQuotationDraftAsync(
        Guid customerId,
        string sourceText,
        List<QuotationItemContractDto> items);

    /// <summary>
    /// Retrieves the most recent order identifier for a customer.
    /// </summary>
    Task<Guid?> GetLastOrderIdByCustomerAsync(Guid customerId);

    /// <summary>
    /// Retrieves the customer identifier mapped to a specified identity user ID.
    /// </summary>
    Task<Guid?> GetCustomerIdByUserIdAsync(Guid userId);

    #endregion
}
