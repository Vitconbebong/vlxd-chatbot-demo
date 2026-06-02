using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VLXD.Modules.WMS.Domain.Entities;

namespace VLXD.Modules.WMS.Infrastructure.Configurations;

/// <summary>
/// Entity configuration for InventoryItem.
/// </summary>
public class InventoryItemConfiguration : IEntityTypeConfiguration<InventoryItem>
{
    #region Methods

    public void Configure(EntityTypeBuilder<InventoryItem> builder)
    {
        builder.ToTable("Inventory");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.QuantityOnHand)
            .HasPrecision(18, 4)
            .IsRequired();

        builder.Property(i => i.QuantityReserved)
            .HasPrecision(18, 4)
            .IsRequired();

        builder.Property(i => i.BinLocation)
            .HasMaxLength(50);

        // A warehouse should have only one inventory record per product
        builder.HasIndex(i => new { i.WarehouseId, i.ProductId })
            .IsUnique();
    }

    #endregion
}
