using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VLXD.Modules.AI.Domain.Entities;

namespace VLXD.Modules.AI.Infrastructure.Configurations;

/// <summary>
/// EF Core Fluent API configuration for the ProductEmbedding entity.
/// </summary>
public class ProductEmbeddingConfig : IEntityTypeConfiguration<ProductEmbedding>
{
    #region Methods

    /// <summary>
    /// Configures constraints, columns, and indexes for ProductEmbedding.
    /// </summary>
    public void Configure(EntityTypeBuilder<ProductEmbedding> builder)
    {
        builder.ToTable("ProductEmbeddings");

        builder.HasKey(x => x.Id);

        // Unique index on ProductId for semantic search integrity
        builder.HasIndex(x => x.ProductId)
            .IsUnique();

        builder.Property(x => x.ContentText)
            .IsRequired();

        // Map vector arrays to binary columns
        builder.Property(x => x.Embedding)
            .IsRequired();
    }

    #endregion
}
