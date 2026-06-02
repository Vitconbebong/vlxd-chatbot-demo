using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using VLXD.Modules.Sales.Domain.Entities;
using VLXD.Modules.Sales.Domain.Enums;
using VLXD.Modules.Sales.Infrastructure;
using VLXD.SharedKernel.Domain.Events;

namespace VLXD.Modules.Sales.Application.Handlers;

/// <summary>
/// Handles CustomerUpdatedEvent to synchronize Identity user updates into the Sales database schema.
/// </summary>
public class CustomerUpdatedHandler : INotificationHandler<CustomerUpdatedEvent>
{
    #region Fields

    private readonly SalesDbContext _dbContext;

    #endregion

    #region Constructors

    /// <summary>
    /// Initializes a new instance of the CustomerUpdatedHandler class.
    /// </summary>
    public CustomerUpdatedHandler(SalesDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    #endregion

    #region Methods

    /// <summary>
    /// Processes user update messages, updating local Customer entity.
    /// </summary>
    public async Task Handle(CustomerUpdatedEvent notification, CancellationToken cancellationToken)
    {
        var customer = await _dbContext.Customers
            .FirstOrDefaultAsync(c => c.Id == notification.CustomerId, cancellationToken);

        if (customer != null)
        {
            if (!Enum.TryParse<CustomerTier>(notification.Tier, out var tier))
            {
                tier = CustomerTier.Retail;
            }

            customer.Name = notification.Name;
            customer.Phone = notification.Phone;
            customer.Email = notification.Email;
            customer.Address = notification.Address;
            customer.Tier = tier;

            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    #endregion
}
