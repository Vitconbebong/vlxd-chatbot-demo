using System;
using VLXD.SharedKernel.Domain;

namespace VLXD.Modules.AI.Domain.Entities;

/// <summary>
/// Stores semantic vector embeddings for a catalog product.
/// </summary>
public class ProductEmbedding : Entity
{
    #region Properties

    /// <summary>
    /// Gets the associated product identifier.
    /// </summary>
    public Guid ProductId { get; private set; }

    /// <summary>
    /// Gets the rich text context representing the product's name, specifications, and details.
    /// </summary>
    public string ContentText { get; private set; }

    /// <summary>
    /// Gets the binary representation of the float[] vector embedding.
    /// </summary>
    public byte[] Embedding { get; private set; }

    #endregion

    #region Constructors

    /// <summary>
    /// EF core constructor.
    /// </summary>
    private ProductEmbedding() { }

    /// <summary>
    /// Initializes a new instance of the ProductEmbedding class.
    /// </summary>
    public ProductEmbedding(Guid productId, string contentText, byte[] embedding)
    {
        ProductId = productId;
        ContentText = contentText;
        Embedding = embedding;
    }

    #endregion

    #region Methods

    /// <summary>
    /// Updates the embedding values and content text.
    /// </summary>
    public void Update(string contentText, byte[] embedding)
    {
        ContentText = contentText;
        Embedding = embedding;
        UpdatedAt = DateTime.UtcNow;
    }

    #endregion
}
