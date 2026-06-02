using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using VLXD.Modules.Catalog.Domain.Entities;
using VLXD.SharedKernel.Application;
using VLXD.SharedKernel.Domain;

namespace VLXD.Modules.Catalog.Infrastructure;

/// <summary>
/// Database context for the Catalog module, implementing the Unit of Work pattern.
/// </summary>
public class CatalogDbContext : DbContext, IUnitOfWork
{
    #region Fields

    private readonly IMediator? _mediator;

    #endregion

    #region Properties

    /// <summary>
    /// Gets or sets the Products table.
    /// </summary>
    public DbSet<Product> Products => Set<Product>();

    /// <summary>
    /// Gets or sets the Categories table.
    /// </summary>
    public DbSet<Category> Categories => Set<Category>();

    /// <summary>
    /// Gets or sets the ProductSpecs table.
    /// </summary>
    public DbSet<ProductSpec> ProductSpecs => Set<ProductSpec>();

    /// <summary>
    /// Gets or sets the ProductAliases table.
    /// </summary>
    public DbSet<ProductAlias> ProductAliases => Set<ProductAlias>();

    /// <summary>
    /// Gets or sets the PriceTiers table.
    /// </summary>
    public DbSet<PriceTier> PriceTiers => Set<PriceTier>();

    #endregion

    #region Constructors

    /// <summary>
    /// Initializes a new instance of the CatalogDbContext class.
    /// </summary>
    public CatalogDbContext(DbContextOptions<CatalogDbContext> options, IMediator? mediator = null)
        : base(options)
    {
        _mediator = mediator;
    }

    #endregion

    #region Methods

    /// <summary>
    /// Configures the schema separation and model configuration classes.
    /// </summary>
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Separate module tables within their own schema
        modelBuilder.HasDefaultSchema("catalog");

        // Apply all configurations from the current assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CatalogDbContext).Assembly);
    }

    /// <summary>
    /// Overrides SaveChangesAsync to inject timestamp auditing and publish domain events.
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
                entry.Property(x => x.CreatedAt).IsModified = false; // Prevent modification of creation timestamp
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
    /// Collects and dispatches registered domain events to their respective handlers in process.
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
