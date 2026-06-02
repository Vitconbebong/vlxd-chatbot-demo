using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VLXD.Modules.Catalog.Domain.Entities;

namespace VLXD.Modules.Catalog.Infrastructure.Configurations;

/// <summary>
/// EF Core configuration for the ProductAlias entity.
/// </summary>
public class ProductAliasConfiguration : IEntityTypeConfiguration<ProductAlias>
{
    #region Methods

    /// <summary>
    /// Configures the ProductAlias entity properties, keys, indices, and relationships.
    /// </summary>
    public void Configure(EntityTypeBuilder<ProductAlias> builder)
    {
        builder.ToTable("ProductAliases");

        builder.HasKey(a => a.Id);

        // Index on AliasName since search logic queries this column heavily
        builder.HasIndex(a => a.AliasName);

        builder.Property(a => a.AliasName)
            .IsRequired()
            .HasMaxLength(200);
    }

    #endregion
}
