using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using VLXD.Modules.Sales.Infrastructure;
using VLXD.SharedKernel.Application.Contracts;

namespace VLXD.Modules.Sales;

/// <summary>
/// Service registration entry point for the Sales module.
/// </summary>
public static class SalesModule
{
    #region Methods

    /// <summary>
    /// Registers all dependencies of the Sales module, including DB context.
    /// </summary>
    public static IServiceCollection AddSalesModule(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<SalesDbContext>(options =>
            options.UseSqlServer(connectionString));

        services.AddScoped<ISalesModule, Infrastructure.Services.SalesModuleService>();

        return services;
    }

    #endregion
}
