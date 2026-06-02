using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VLXD.Modules.Sales.Domain.Entities;

namespace VLXD.Modules.Sales.Infrastructure.Configurations;

/// <summary>
/// EF Core configuration for the Customer entity in the Sales module.
/// </summary>
public class CustomerConfiguration : IEntityTypeConfiguration<Customer>
{
    #region Methods

    /// <summary>
    /// Configures table schemas, keys, indices, and constraints for Customers.
    /// </summary>
    public void Configure(EntityTypeBuilder<Customer> builder)
    {
        builder.ToTable("Customers");

        builder.HasKey(c => c.Id);

        // Unique indexes on business key fields
        builder.HasIndex(c => c.Phone)
            .IsUnique();

        builder.HasIndex(c => c.UserId)
            .IsUnique();

        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(c => c.Phone)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(c => c.Email)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(c => c.Address)
            .IsRequired()
            .HasMaxLength(500);

        // Save tier enum values as string codes in DB
        builder.Property(c => c.Tier)
            .IsRequired()
            .HasConversion<string>()
            .HasMaxLength(50);
    }

    #endregion
}
