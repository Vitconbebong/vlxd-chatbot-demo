using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VLXD.Modules.Sales.Domain.Entities;

namespace VLXD.Modules.Sales.Infrastructure.Configurations;

/// <summary>
/// EF Core configuration for the Quotation entity.
/// </summary>
public class QuotationConfiguration : IEntityTypeConfiguration<Quotation>
{
    #region Methods

    /// <summary>
    /// Configures database settings for material quotations.
    /// </summary>
    public void Configure(EntityTypeBuilder<Quotation> builder)
    {
        builder.ToTable("Quotations");

        builder.HasKey(q => q.Id);

        builder.Property(q => q.SourceText)
            .IsRequired();

        builder.Property(q => q.Status)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(q => q.TotalEstimated)
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(q => q.CreatedByAi)
            .IsRequired();

        // Wire relationships
        builder.HasOne(q => q.Customer)
            .WithMany()
            .HasForeignKey(q => q.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(q => q.Items)
            .WithOne(i => i.Quotation)
            .HasForeignKey(i => i.QuotationId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    #endregion
}
