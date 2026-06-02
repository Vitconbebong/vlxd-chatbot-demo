using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using VLXD.Modules.Catalog.Infrastructure;

namespace VLXD.Modules.Catalog;

/// <summary>
/// Service registration entry point for the Catalog module.
/// </summary>
public static class CatalogModule
{
    #region Methods

    /// <summary>
    /// Registers all dependencies of the Catalog module, including DbContext and validators.
    /// </summary>
    public static IServiceCollection AddCatalogModule(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        // Registers the DB context with SQL Server connectivity settings
        services.AddDbContext<CatalogDbContext>(options =>
            options.UseSqlServer(connectionString));

        // Registers all validators within this Catalog module assembly
        services.AddValidatorsFromAssembly(typeof(CatalogModule).Assembly);

        // Register cross-module service contract implementation
        services.AddScoped<VLXD.SharedKernel.Application.Contracts.ICatalogModule, Infrastructure.Services.CatalogModuleService>();

        return services;
    }

    #endregion
}
