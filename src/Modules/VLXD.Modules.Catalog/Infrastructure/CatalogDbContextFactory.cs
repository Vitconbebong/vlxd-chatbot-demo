using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace VLXD.Modules.Catalog.Infrastructure;

/// <summary>
/// Design-time factory for CatalogDbContext to support EF Core CLI tools.
/// </summary>
public class CatalogDbContextFactory : IDesignTimeDbContextFactory<CatalogDbContext>
{
    #region Methods

    /// <summary>
    /// Creates a new instance of CatalogDbContext for migrations.
    /// </summary>
    public CatalogDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<CatalogDbContext>();
        
        // Use default local development credentials for SQL Server during design-time migrations
        optionsBuilder.UseSqlServer("Server=localhost,1433;Database=VlxdDb;User Id=sa;Password=VlxdDev@2024;TrustServerCertificate=true;");

        return new CatalogDbContext(optionsBuilder.Options);
    }

    #endregion
}
