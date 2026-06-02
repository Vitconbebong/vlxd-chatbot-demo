using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using VLXD.Modules.AI.Domain.Entities;

namespace VLXD.Modules.AI.Infrastructure.Configurations;

/// <summary>
/// EF Core Fluent API configuration for the ChatSession entity.
/// </summary>
public class ChatSessionConfig : IEntityTypeConfiguration<ChatSession>
{
    #region Methods

    /// <summary>
    /// Configures constraints and relationships for ChatSession.
    /// </summary>
    public void Configure(EntityTypeBuilder<ChatSession> builder)
    {
        builder.ToTable("ChatSessions");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Channel)
            .IsRequired()
            .HasMaxLength(20);

        // One-to-many relationship with ChatMessage
        builder.HasMany(x => x.Messages)
            .WithOne(x => x.Session)
            .HasForeignKey(x => x.SessionId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    #endregion
}
