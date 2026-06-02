using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using VLXD.Modules.AI.Domain.Entities;
using VLXD.SharedKernel.Application;
using VLXD.SharedKernel.Domain;

namespace VLXD.Modules.AI.Infrastructure;

/// <summary>
/// Database context for the AI module, implementing the Unit of Work pattern.
/// </summary>
public class AiDbContext : DbContext, IUnitOfWork
{
    #region Fields

    private readonly IMediator? _mediator;

    #endregion

    #region Properties

    /// <summary>
    /// Gets or sets the ProductEmbeddings table.
    /// </summary>
    public DbSet<ProductEmbedding> ProductEmbeddings => Set<ProductEmbedding>();

    /// <summary>
    /// Gets or sets the ChatSessions table.
    /// </summary>
    public DbSet<ChatSession> ChatSessions => Set<ChatSession>();

    /// <summary>
    /// Gets or sets the ChatMessages table.
    /// </summary>
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();

    /// <summary>
    /// Gets or sets the SupportTickets table.
    /// </summary>
    public DbSet<SupportTicket> SupportTickets => Set<SupportTicket>();

    #endregion

    #region Constructors

    /// <summary>
    /// Initializes a new instance of the AiDbContext class.
    /// </summary>
    public AiDbContext(DbContextOptions<AiDbContext> options, IMediator? mediator = null)
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

        // Separate AI module tables within their own schema
        modelBuilder.HasDefaultSchema("ai");

        // Apply all configurations from the current assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AiDbContext).Assembly);
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
