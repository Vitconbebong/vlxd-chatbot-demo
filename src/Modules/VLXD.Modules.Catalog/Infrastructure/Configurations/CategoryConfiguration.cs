using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VLXD.Modules.Catalog.Domain.Entities;

namespace VLXD.Modules.Catalog.Infrastructure.Configurations;

/// <summary>
/// EF Core configuration for the Category entity.
/// </summary>
public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    #region Methods

    /// <summary>
    /// Configures the Category entity properties and relationships.
    /// </summary>
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("Categories");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(c => c.SortOrder)
            .HasDefaultValue(0);

        // Self-referencing relationship configuration
        builder.HasOne(c => c.Parent)
            .WithMany(c => c.Children)
            .HasForeignKey(c => c.ParentId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    #endregion
}
