using System.Threading;
using System.Threading.Tasks;

namespace VLXD.SharedKernel.Application;

/// <summary>
/// Contract for the Unit of Work pattern, ensuring transactional consistency.
/// </summary>
public interface IUnitOfWork
{
    #region Methods

    /// <summary>
    /// Persists all changes tracked by the unit of work to the database.
    /// </summary>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>The number of state entries written to the database.</returns>
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

    #endregion
}
