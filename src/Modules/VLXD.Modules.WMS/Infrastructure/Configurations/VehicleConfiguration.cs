using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VLXD.Modules.WMS.Domain.Entities;

namespace VLXD.Modules.WMS.Infrastructure.Configurations;

/// <summary>
/// Entity configuration for Vehicle.
/// </summary>
public class VehicleConfiguration : IEntityTypeConfiguration<Vehicle>
{
    #region Methods

    public void Configure(EntityTypeBuilder<Vehicle> builder)
    {
        builder.ToTable("Vehicles");

        builder.HasKey(v => v.Id);

        builder.Property(v => v.PlateNumber)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(v => v.DriverName)
            .HasMaxLength(100)
            .IsRequired();

        builder.Property(v => v.DriverPhone)
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(v => v.CurrentStatus)
            .HasMaxLength(20)
            .IsRequired();

        builder.HasMany(v => v.DeliveryOrders)
            .WithOne(d => d.Vehicle)
            .HasForeignKey(d => d.VehicleId)
            .OnDelete(DeleteBehavior.SetNull);
    }

    #endregion
}
