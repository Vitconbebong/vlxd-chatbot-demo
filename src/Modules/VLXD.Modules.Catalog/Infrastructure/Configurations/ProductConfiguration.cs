using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VLXD.Modules.Catalog.Domain.Entities;

namespace VLXD.Modules.Catalog.Infrastructure.Configurations;

/// <summary>
/// EF Core configuration for the Product entity.
/// </summary>
public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    #region Methods

    /// <summary>
    /// Configures the Product entity properties, keys, indices, and relationships.
    /// </summary>
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products");

        builder.HasKey(p => p.Id);

        // SKU must be unique across the catalog
        builder.HasIndex(p => p.Sku)
            .IsUnique();

        builder.Property(p => p.Sku)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(p => p.Description)
            .IsRequired();

        builder.Property(p => p.BasePrice)
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(p => p.UnitOfMeasure)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(p => p.UnitsPerPackage)
            .HasPrecision(18, 4);

        builder.Property(p => p.CoveragePerPackage)
            .HasPrecision(18, 4);

        builder.Property(p => p.WastageRate)
            .IsRequired()
            .HasPrecision(5, 2);

        builder.Property(p => p.ImageUrl)
            .HasMaxLength(500);

        // Relationship mapping
        builder.HasOne(p => p.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(p => p.Specs)
            .WithOne(s => s.Product)
            .HasForeignKey(s => s.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.Aliases)
            .WithOne(a => a.Product)
            .HasForeignKey(a => a.ProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(p => p.PriceTiers)
            .WithOne(pt => pt.Product)
            .HasForeignKey(pt => pt.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    #endregion
}
