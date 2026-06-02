using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VLXD.Modules.AI.Domain.Entities;
using VLXD.Modules.AI.Domain.Enums;

namespace VLXD.Modules.AI.Infrastructure.Configurations;

/// <summary>
/// EF Core Fluent API configuration for the ChatMessage entity.
/// </summary>
public class ChatMessageConfig : IEntityTypeConfiguration<ChatMessage>
{
    #region Methods

    /// <summary>
    /// Configures constraints for ChatMessage.
    /// </summary>
    public void Configure(EntityTypeBuilder<ChatMessage> builder)
    {
        builder.ToTable("ChatMessages");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Role)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(x => x.Content)
            .IsRequired();

        // Convert enum to string for database storage
        builder.Property(x => x.Sentiment)
            .HasConversion(
                v => v.HasValue ? v.Value.ToString() : null,
                v => !string.IsNullOrEmpty(v) ? (SentimentLevel)Enum.Parse(typeof(SentimentLevel), v) : null)
            .HasMaxLength(20)
            .IsRequired(false);
    }

    #endregion
}
