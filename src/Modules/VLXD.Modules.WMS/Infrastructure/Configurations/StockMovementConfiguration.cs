using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VLXD.Modules.WMS.Domain.Entities;

namespace VLXD.Modules.WMS.Infrastructure.Configurations;

/// <summary>
/// Entity configuration for StockMovement.
/// </summary>
public class StockMovementConfiguration : IEntityTypeConfiguration<StockMovement>
{
    #region Methods

    public void Configure(EntityTypeBuilder<StockMovement> builder)
    {
        builder.ToTable("StockMovements");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.Quantity)
            .HasPrecision(18, 4)
            .IsRequired();

        builder.Property(m => m.MovementType)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(m => m.ReferenceNumber)
            .HasMaxLength(50)
            .IsRequired();

        builder.Property(m => m.Notes)
            .IsRequired(false);
    }

    #endregion
}
