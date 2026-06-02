using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VLXD.Modules.WMS.Domain.Entities;

namespace VLXD.Modules.WMS.Infrastructure.Configurations;

/// <summary>
/// Entity configuration for DeliveryOrder.
/// </summary>
public class DeliveryOrderConfiguration : IEntityTypeConfiguration<DeliveryOrder>
{
    #region Methods

    public void Configure(EntityTypeBuilder<DeliveryOrder> builder)
    {
        builder.ToTable("DeliveryOrders");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.DeliveryAddress)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(d => d.Status)
            .HasConversion<string>()
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(d => d.Notes)
            .IsRequired(false);

        builder.HasIndex(d => d.OrderId);
    }

    #endregion
}
