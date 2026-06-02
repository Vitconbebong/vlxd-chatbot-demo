using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace VLXD.Modules.AI.Infrastructure;

/// <summary>
/// Design-time factory for AiDbContext to support EF Core CLI tools.
/// </summary>
public class AiDbContextFactory : IDesignTimeDbContextFactory<AiDbContext>
{
    #region Methods

    /// <summary>
    /// Creates a new instance of AiDbContext for migrations.
    /// </summary>
    public AiDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AiDbContext>();
        
        // Use default local development credentials for SQL Server during design-time migrations
        optionsBuilder.UseSqlServer("Server=localhost,1433;Database=VlxdDb;User Id=sa;Password=VlxdDev@2024;TrustServerCertificate=true;");

        return new AiDbContext(optionsBuilder.Options);
    }

    #endregion
}
