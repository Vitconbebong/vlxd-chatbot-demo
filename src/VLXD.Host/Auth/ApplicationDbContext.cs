using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace VLXD.Host.Auth;

/// <summary>
/// Database context for ASP.NET Core Identity authentication and authorization.
/// </summary>
public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    #region Constructors

    /// <summary>
    /// Initializes a new instance of the ApplicationDbContext class.
    /// </summary>
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    #endregion

    #region Methods

    /// <summary>
    /// Configures identity schema separation layout.
    /// </summary>
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Group ASP.NET Core Identity tables within their own schema
        builder.HasDefaultSchema("identity");
    }

    #endregion
}
