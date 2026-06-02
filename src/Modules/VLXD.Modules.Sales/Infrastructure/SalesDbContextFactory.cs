using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace VLXD.Modules.Sales.Infrastructure;

/// <summary>
/// Design-time factory for SalesDbContext to support EF Core CLI tools.
/// </summary>
public class SalesDbContextFactory : IDesignTimeDbContextFactory<SalesDbContext>
{
    #region Methods

    /// <summary>
    /// Creates a new instance of SalesDbContext for migrations.
    /// </summary>
    public SalesDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<SalesDbContext>();
        
        // Use default local development credentials for SQL Server during design-time migrations
        optionsBuilder.UseSqlServer("Server=localhost,1433;Database=VlxdDb;User Id=sa;Password=VlxdDev@2024;TrustServerCertificate=true;");

        return new SalesDbContext(optionsBuilder.Options);
    }

    #endregion
}
