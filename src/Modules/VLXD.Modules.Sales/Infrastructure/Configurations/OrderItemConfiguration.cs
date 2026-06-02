using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VLXD.Modules.Sales.Domain.Entities;

namespace VLXD.Modules.Sales.Infrastructure.Configurations;

/// <summary>
/// EF Core configuration for the OrderItem entity.
/// </summary>
public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    #region Methods

    /// <summary>
    /// Configures constraints and column details for OrderItems.
    /// </summary>
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.ToTable("OrderItems");

        builder.HasKey(oi => oi.Id);

        builder.Property(oi => oi.ProductName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(oi => oi.Quantity)
            .IsRequired();

        builder.Property(oi => oi.Unit)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(oi => oi.UnitPrice)
            .IsRequired()
            .HasPrecision(18, 2);
    }

    #endregion
}
