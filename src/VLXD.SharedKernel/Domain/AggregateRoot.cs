using System;
using System.Collections.Generic;

namespace VLXD.SharedKernel.Domain;

/// <summary>
/// Base class for all aggregate roots in the domain model.
/// Aggregate roots manage lifecycle and domain events for their aggregates.
/// </summary>
public abstract class AggregateRoot : Entity
{
    #region Fields

    private readonly List<IDomainEvent> _domainEvents = new();

    #endregion

    #region Properties

    /// <summary>
    /// Gets a read-only list of domain events associated with the aggregate root.
    /// </summary>
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    #endregion

    #region Constructors

    /// <summary>
    /// Initializes a new instance of the AggregateRoot class.
    /// </summary>
    protected AggregateRoot() : base()
    {
    }

    /// <summary>
    /// Initializes a new instance of the AggregateRoot class with a specified identifier.
    /// </summary>
    /// <param name="id">The predefined unique identifier.</param>
    protected AggregateRoot(Guid id) : base(id)
    {
    }

    #endregion

    #region Methods

    /// <summary>
    /// Registers a new domain event to be dispatched when changes are saved.
    /// </summary>
    /// <param name="domainEvent">The domain event instance.</param>
    public void AddDomainEvent(IDomainEvent domainEvent)
    {
        _domainEvents.Add(domainEvent);
    }

    /// <summary>
    /// Removes a registered domain event.
    /// </summary>
    /// <param name="domainEvent">The domain event instance to remove.</param>
    public void RemoveDomainEvent(IDomainEvent domainEvent)
    {
        _domainEvents.Remove(domainEvent);
    }

    /// <summary>
    /// Clears all registered domain events.
    /// </summary>
    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
    }

    #endregion
}
