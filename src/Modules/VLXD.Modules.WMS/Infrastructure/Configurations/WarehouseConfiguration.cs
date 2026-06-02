using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VLXD.Modules.WMS.Domain.Entities;

namespace VLXD.Modules.WMS.Infrastructure.Configurations;

/// <summary>
/// Entity configuration for Warehouse.
/// </summary>
public class WarehouseConfiguration : IEntityTypeConfiguration<Warehouse>
{
    #region Methods

    public void Configure(EntityTypeBuilder<Warehouse> builder)
    {
        builder.ToTable("Warehouses");

        builder.HasKey(w => w.Id);

        builder.Property(w => w.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(w => w.Address)
            .HasMaxLength(500)
            .IsRequired();

        builder.HasMany(w => w.InventoryItems)
            .WithOne(i => i.Warehouse)
            .HasForeignKey(i => i.WarehouseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(w => w.StockMovements)
            .WithOne(m => m.Warehouse)
            .HasForeignKey(m => m.WarehouseId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    #endregion
}
