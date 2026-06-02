using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using VLXD.Modules.WMS.Domain.Entities;
using VLXD.SharedKernel.Application;
using VLXD.SharedKernel.Domain;

namespace VLXD.Modules.WMS.Infrastructure;

/// <summary>
/// Database context for the Warehouse Management System (WMS) module.
/// </summary>
public class WmsDbContext : DbContext, IUnitOfWork
{
    #region Fields

    private readonly IMediator? _mediator;

    #endregion

    #region Properties

    /// <summary>
    /// Gets or sets the Warehouses table.
    /// </summary>
    public DbSet<Warehouse> Warehouses => Set<Warehouse>();

    /// <summary>
    /// Gets or sets the Inventory items table.
    /// </summary>
    public DbSet<InventoryItem> Inventory => Set<InventoryItem>();

    /// <summary>
    /// Gets or sets the Stock movements table.
    /// </summary>
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();

    /// <summary>
    /// Gets or sets the Delivery orders table.
    /// </summary>
    public DbSet<DeliveryOrder> DeliveryOrders => Set<DeliveryOrder>();

    /// <summary>
    /// Gets or sets the Vehicles table.
    /// </summary>
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();

    #endregion

    #region Constructors

    /// <summary>
    /// Initializes a new instance of the WmsDbContext class.
    /// </summary>
    public WmsDbContext(DbContextOptions<WmsDbContext> options, IMediator? mediator = null)
        : base(options)
    {
        _mediator = mediator;
    }

    #endregion

    #region Methods

    /// <summary>
    /// Configures the default schema and applies configuration class definitions.
    /// </summary>
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Separate module tables within their own schema
        modelBuilder.HasDefaultSchema("wms");

        // Apply all configurations defined in this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(WmsDbContext).Assembly);
    }

    /// <summary>
    /// Saves changes to the database, automatically updating auditing timestamps and publishing events.
    /// </summary>
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Audit entity timestamps
        foreach (var entry in ChangeTracker.Entries<Entity>())
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
                entry.Property(x => x.CreatedAt).IsModified = false;
            }
        }

        int result = await base.SaveChangesAsync(cancellationToken);

        // Dispatch domain events if MediatR is available
        if (_mediator != null)
        {
            await DispatchDomainEventsAsync();
        }

        return result;
    }

    /// <summary>
    /// Collects and dispatches registered domain events to their handlers in process.
    /// </summary>
    private async Task DispatchDomainEventsAsync()
    {
        var domainEntities = ChangeTracker
            .Entries<AggregateRoot>()
            .Where(x => x.Entity.DomainEvents.Any())
            .Select(x => x.Entity)
            .ToList();

        var domainEvents = domainEntities
            .SelectMany(x => x.DomainEvents)
            .ToList();

        foreach (var entity in domainEntities)
        {
            entity.ClearDomainEvents();
        }

        foreach (var domainEvent in domainEvents)
        {
            await _mediator!.Publish(domainEvent);
        }
    }

    #endregion
}
