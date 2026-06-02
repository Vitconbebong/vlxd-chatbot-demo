using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VLXD.Modules.Catalog.Domain.Entities;

namespace VLXD.Modules.Catalog.Infrastructure.Configurations;

/// <summary>
/// EF Core configuration for the ProductSpec entity.
/// </summary>
public class ProductSpecConfiguration : IEntityTypeConfiguration<ProductSpec>
{
    #region Methods

    /// <summary>
    /// Configures the ProductSpec entity properties, keys, indices, and relationships.
    /// </summary>
    public void Configure(EntityTypeBuilder<ProductSpec> builder)
    {
        builder.ToTable("ProductSpecs");

        builder.HasKey(s => s.Id);

        // Composite index to prevent duplicate keys per product and optimize lookups
        builder.HasIndex(s => new { s.ProductId, s.SpecKey })
            .IsUnique();

        builder.Property(s => s.SpecKey)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(s => s.SpecValue)
            .IsRequired()
            .HasMaxLength(200);
    }

    #endregion
}
