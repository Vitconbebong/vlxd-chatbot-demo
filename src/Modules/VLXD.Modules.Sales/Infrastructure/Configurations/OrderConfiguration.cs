using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VLXD.Modules.Sales.Domain.Entities;

namespace VLXD.Modules.Sales.Infrastructure.Configurations;

/// <summary>
/// EF Core configuration for the Order entity in the Sales module.
/// </summary>
public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    #region Methods

    /// <summary>
    /// Configures constraints, indices, and relationships for the Order aggregate.
    /// </summary>
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");

        builder.HasKey(o => o.Id);

        // OrderNumber acts as unique identifier index
        builder.HasIndex(o => o.OrderNumber)
            .IsUnique();

        builder.Property(o => o.OrderNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(o => o.Status)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.Property(o => o.TotalAmount)
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(o => o.DeliveryAddress)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(o => o.Notes)
            .HasMaxLength(2000);

        // Define modular aggregate relationships
        builder.HasOne(o => o.Customer)
            .WithMany()
            .HasForeignKey(o => o.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(o => o.Items)
            .WithOne(i => i.Order)
            .HasForeignKey(i => i.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    #endregion
}
