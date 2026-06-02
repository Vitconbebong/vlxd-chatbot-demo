using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VLXD.Modules.Sales.Domain.Entities;

namespace VLXD.Modules.Sales.Infrastructure.Configurations;

/// <summary>
/// EF Core configuration for the QuotationItem entity.
/// </summary>
public class QuotationItemConfiguration : IEntityTypeConfiguration<QuotationItem>
{
    #region Methods

    /// <summary>
    /// Configures details, constraints, and precision for QuotationItems.
    /// </summary>
    public void Configure(EntityTypeBuilder<QuotationItem> builder)
    {
        builder.ToTable("QuotationItems");

        builder.HasKey(qi => qi.Id);

        builder.Property(qi => qi.RawItemText)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(qi => qi.Quantity)
            .IsRequired();

        builder.Property(qi => qi.Unit)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(qi => qi.UnitPrice)
            .IsRequired()
            .HasPrecision(18, 2);

        builder.Property(qi => qi.ConfidenceScore)
            .IsRequired()
            .HasPrecision(5, 2);
    }

    #endregion
}
