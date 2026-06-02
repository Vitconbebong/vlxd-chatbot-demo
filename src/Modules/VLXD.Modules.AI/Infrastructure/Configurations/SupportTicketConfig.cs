using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VLXD.Modules.AI.Domain.Entities;
using VLXD.Modules.AI.Domain.Enums;

namespace VLXD.Modules.AI.Infrastructure.Configurations;

/// <summary>
/// EF Core Fluent API configuration for the SupportTicket entity.
/// </summary>
public class SupportTicketConfig : IEntityTypeConfiguration<SupportTicket>
{
    #region Methods

    /// <summary>
    /// Configures constraints and relationships for SupportTicket.
    /// </summary>
    public void Configure(EntityTypeBuilder<SupportTicket> builder)
    {
        builder.ToTable("SupportTickets");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Summary)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(x => x.Status)
            .IsRequired()
            .HasMaxLength(20);

        // Convert enum to string in database
        builder.Property(x => x.Priority)
            .HasConversion(
                v => v.ToString(),
                v => (TicketPriority)Enum.Parse(typeof(TicketPriority), v))
            .HasMaxLength(20)
            .IsRequired();

        // FK relation to ChatSession
        builder.HasOne(x => x.Session)
            .WithMany()
            .HasForeignKey(x => x.SessionId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    #endregion
}
