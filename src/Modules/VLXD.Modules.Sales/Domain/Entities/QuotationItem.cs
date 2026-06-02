using System;
using VLXD.SharedKernel.Domain;

namespace VLXD.Modules.Sales.Domain.Entities;

/// <summary>
/// Represents an item line within an AI-extracted material quotation request.
/// </summary>
public class QuotationItem : Entity
{
    #region Properties

    /// <summary>
    /// Gets or sets the parent quotation identifier.
    /// </summary>
    public Guid QuotationId { get; set; }

    /// <summary>
    /// Gets or sets the matched product identifier from catalog. Null if no close match is found.
    /// </summary>
    public Guid? MatchedProductId { get; set; }

    /// <summary>
    /// Gets or sets the raw, unparsed item text string sent by the user.
    /// </summary>
    public string RawItemText { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the parsed item quantity.
    /// </summary>
    public int Quantity { get; set; }

    /// <summary>
    /// Gets or sets the parsed item unit.
    /// </summary>
    public string Unit { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the estimated or snapshot price for the matched product.
    /// </summary>
    public decimal UnitPrice { get; set; }

    /// <summary>
    /// Gets or sets the AI confidence matching score (0.00 to 1.00).
    /// </summary>
    public decimal ConfidenceScore { get; set; }

    /// <summary>
    /// Gets the computed estimated subtotal.
    /// </summary>
    public decimal Subtotal => Quantity * UnitPrice;

    #endregion

    #region Constructors

    /// <summary>
    /// Required default constructor for Entity Framework Core.
    /// </summary>
    public QuotationItem() : base()
    {
    }

    /// <summary>
    /// Initializes a new instance of the QuotationItem class.
    /// </summary>
    public QuotationItem(
        Guid? matchedProductId, 
        string rawItemText, 
        int quantity, 
        string unit, 
        decimal unitPrice, 
        decimal confidenceScore) : base()
    {
        MatchedProductId = matchedProductId;
        RawItemText = rawItemText;
        Quantity = quantity;
        Unit = unit;
        UnitPrice = unitPrice;
        ConfidenceScore = confidenceScore;
    }

    #endregion

    #region Navigation Properties

    /// <summary>
    /// Gets or sets the parent quotation details.
    /// </summary>
    public virtual Quotation? Quotation { get; set; }

    #endregion
}
