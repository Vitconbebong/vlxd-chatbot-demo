using System.Collections.Generic;

namespace VLXD.SharedKernel.Application;

/// <summary>
/// Container representing a paginated set of items.
/// </summary>
/// <typeparam name="T">The type of the paginated items.</typeparam>
public record PagedResult<T>(
    IReadOnlyCollection<T> Items,
    int TotalCount,
    int Page,
    int PageSize)
{
    #region Properties

    /// <summary>
    /// Gets the total number of pages calculated from the TotalCount and PageSize.
    /// </summary>
    public int TotalPages => PageSize > 0
        ? (int)System.Math.Ceiling((double)TotalCount / PageSize)
        : 0;

    #endregion
}
