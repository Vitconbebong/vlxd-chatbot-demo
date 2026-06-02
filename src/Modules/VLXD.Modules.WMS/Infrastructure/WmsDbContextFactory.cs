using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace VLXD.Modules.WMS.Infrastructure;

/// <summary>
/// Design-time factory for WmsDbContext to support EF Core CLI tools.
/// </summary>
public class WmsDbContextFactory : IDesignTimeDbContextFactory<WmsDbContext>
{
    #region Methods

    /// <summary>
    /// Creates a new instance of WmsDbContext for migrations.
    /// </summary>
    public WmsDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<WmsDbContext>();
        
        // Use default local development credentials for SQL Server during design-time migrations
        optionsBuilder.UseSqlServer("Server=localhost,1433;Database=VlxdDb;User Id=sa;Password=VlxdDev@2024;TrustServerCertificate=true;");

        return new WmsDbContext(optionsBuilder.Options);
    }

    #endregion
}
