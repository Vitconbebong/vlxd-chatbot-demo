using System;

namespace VLXD.SharedKernel.Domain;

/// <summary>
/// Base class for all domain entities. Identity is determined by the Id property.
/// </summary>
public abstract class Entity
{
    #region Properties

    /// <summary>
    /// Gets the unique identifier for the entity.
    /// </summary>
    public Guid Id { get; protected set; }

    /// <summary>
    /// Gets or sets the date and time when the entity was created.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Gets or sets the date and time when the entity was last updated.
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    #endregion

    #region Constructors

    /// <summary>
    /// Initializes a new instance of the Entity class with a generated Guid.
    /// </summary>
    protected Entity()
    {
        Id = Guid.NewGuid();
        CreatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Initializes a new instance of the Entity class with a specified Guid.
    /// </summary>
    /// <param name="id">The predefined unique identifier.</param>
    protected Entity(Guid id)
    {
        Id = id;
        CreatedAt = DateTime.UtcNow;
    }

    #endregion

    #region Methods

    /// <summary>
    /// Determines whether the specified object is equal to the current entity.
    /// </summary>
    public override bool Equals(object? obj)
    {
        if (obj is not Entity other)
        {
            return false;
        }

        if (ReferenceEquals(this, other))
        {
            return true;
        }

        if (GetType() != other.GetType())
        {
            return false;
        }

        if (Id == Guid.Empty || other.Id == Guid.Empty)
        {
            return false;
        }

        return Id == other.Id;
    }

    /// <summary>
    /// Serves as the default hash function.
    /// </summary>
    public override int GetHashCode()
    {
        return (GetType().ToString() + Id).GetHashCode();
    }

    /// <summary>
    /// Equal operator overload.
    /// </summary>
    public static bool operator ==(Entity? left, Entity? right)
    {
        if (left is null && right is null)
        {
            return true;
        }

        if (left is null || right is null)
        {
            return false;
        }

        return left.Equals(right);
    }

    /// <summary>
    /// Not equal operator overload.
    /// </summary>
    public static bool operator !=(Entity? left, Entity? right)
    {
        return !(left == right);
    }

    #endregion
}
