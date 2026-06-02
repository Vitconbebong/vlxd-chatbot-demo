using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VLXD.Modules.Catalog.Domain.Entities;

namespace VLXD.Modules.Catalog.Infrastructure.Configurations;

/// <summary>
/// EF Core configuration for the PriceTier entity.
/// </summary>
public class PriceTierConfiguration : IEntityTypeConfiguration<PriceTier>
{
    #region Methods

    /// <summary>
    /// Configures the PriceTier entity properties, keys, indices, and relationships.
    /// </summary>
    public void Configure(EntityTypeBuilder<PriceTier> builder)
    {
        builder.ToTable("PriceTiers");

        builder.HasKey(pt => pt.Id);

        // Composite index to optimize tier lookups per product and prevent duplicates
        builder.HasIndex(pt => new { pt.ProductId, pt.TierName })
            .IsUnique();

        builder.Property(pt => pt.TierName)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(pt => pt.Price)
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(pt => pt.MinQuantity)
            .IsRequired()
            .HasDefaultValue(1);
    }

    #endregion
}
