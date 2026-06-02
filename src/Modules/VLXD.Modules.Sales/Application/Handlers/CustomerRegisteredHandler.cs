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
/// Handles CustomerRegisteredEvent to synchronize Identity users into the Sales database schema.
/// </summary>
public class CustomerRegisteredHandler : INotificationHandler<CustomerRegisteredEvent>
{
    #region Fields

    private readonly SalesDbContext _dbContext;

    #endregion

    #region Constructors

    /// <summary>
    /// Initializes a new instance of the CustomerRegisteredHandler class.
    /// </summary>
    public CustomerRegisteredHandler(SalesDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    #endregion

    #region Methods

    /// <summary>
    /// Processes user registration messages, inserting a new local Customer entity if it does not exist.
    /// </summary>
    public async Task Handle(CustomerRegisteredEvent notification, CancellationToken cancellationToken)
    {
        // Avoid duplicate records
        var exists = await _dbContext.Customers.AnyAsync(c => c.Id == notification.CustomerId, cancellationToken);
        if (!exists)
        {
            if (!Enum.TryParse<CustomerTier>(notification.Tier, out var tier))
            {
                tier = CustomerTier.Retail;
            }

            var customer = new Customer(
                id: notification.CustomerId,
                name: notification.Name,
                phone: notification.Phone,
                email: notification.Email,
                address: notification.Address,
                tier: tier,
                userId: notification.CustomerId // Linked directly to Identity User ID
            );

            _dbContext.Customers.Add(customer);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    #endregion
}
