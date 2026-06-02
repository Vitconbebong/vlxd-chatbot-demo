using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VLXD.Modules.Sales.Domain.Entities;
using VLXD.Modules.Sales.Infrastructure;
using VLXD.SharedKernel.Application.Contracts;

namespace VLXD.Modules.Sales.Infrastructure.Services;

/// <summary>
/// Provides cross-module query and command access to sales database structures.
/// </summary>
public class SalesModuleService : ISalesModule
{
    #region Fields

    private readonly SalesDbContext _dbContext;

    #endregion

    #region Constructors

    /// <summary>
    /// Initializes a new instance of the SalesModuleService class.
    /// </summary>
    public SalesModuleService(SalesDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    #endregion

    #region Methods

    /// <summary>
    /// Creates an AI-extracted draft quotation.
    /// </summary>
    public async Task<Guid> CreateQuotationDraftAsync(
        Guid customerId,
        string sourceText,
        List<QuotationItemContractDto> items)
    {
        var quotation = new Quotation(customerId, sourceText, createdByAi: true);
        
        foreach (var item in items)
        {
            quotation.AddItem(
                item.MatchedProductId,
                item.RawItemText,
                item.Quantity,
                item.Unit,
                item.UnitPrice,
                item.ConfidenceScore
            );
        }

        _dbContext.Quotations.Add(quotation);
        await _dbContext.SaveChangesAsync();

        return quotation.Id;
    }

    /// <summary>
    /// Retrieves the most recent order identifier for a customer.
    /// </summary>
    public async Task<Guid?> GetLastOrderIdByCustomerAsync(Guid customerId)
    {
        var order = await _dbContext.Orders
            .Where(x => x.CustomerId == customerId)
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => x.Id)
            .FirstOrDefaultAsync();

        return order == Guid.Empty ? null : order;
    }

    /// <summary>
    /// Retrieves the customer identifier mapped to a specified identity user ID.
    /// </summary>
    public async Task<Guid?> GetCustomerIdByUserIdAsync(Guid userId)
    {
        var customer = await _dbContext.Customers
            .Where(x => x.UserId == userId)
            .Select(x => x.Id)
            .FirstOrDefaultAsync();

        return customer == Guid.Empty ? null : customer;
    }

    #endregion
}
