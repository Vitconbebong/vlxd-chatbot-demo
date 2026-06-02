using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using VLXD.Modules.WMS.Domain.Interfaces;
using VLXD.Modules.WMS.Infrastructure;
using VLXD.Modules.WMS.Infrastructure.MockAdapters;
using VLXD.Modules.WMS.Infrastructure.Services;
using VLXD.SharedKernel.Application.Contracts;

namespace VLXD.Modules.WMS;

/// <summary>
/// Service registration entry point for the WMS (Warehouse Management System) module.
/// </summary>
public static class WmsModule
{
    #region Methods

    /// <summary>
    /// Registers all dependencies of the WMS module.
    /// </summary>
    public static IServiceCollection AddWmsModule(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        services.AddDbContext<WmsDbContext>(options =>
            options.UseSqlServer(connectionString));

        // Register cross-module contract service
        services.AddScoped<IWmsModule, WmsModuleService>();

        // Register infrastructure mock adapters
        services.AddSingleton<IDeliveryTracker, MockDeliveryTracker>();
        services.AddScoped<ISmsNotifier, MockSmsNotifier>();

        return services;
    }

    #endregion
}
