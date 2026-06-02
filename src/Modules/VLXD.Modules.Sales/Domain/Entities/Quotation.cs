using System;
using System.Collections.Generic;
using System.Linq;
using VLXD.Modules.Sales.Domain.Events;
using VLXD.SharedKernel.Domain;

namespace VLXD.Modules.Sales.Domain.Entities;

/// <summary>
/// Represents a material quotation sheet, potentially drafted by local AI algorithms.
/// </summary>
public class Quotation : AggregateRoot
{
    #region Properties

    /// <summary>
    /// Gets or sets the buying customer identifier.
    /// </summary>
    public Guid CustomerId { get; set; }

    /// <summary>
    /// Gets or sets the raw, unstructured request input.
    /// </summary>
    public string SourceText { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the review status ("Draft", "Approved", "Rejected").
    /// </summary>
    public string Status { get; set; } = "Draft";

    /// <summary>
    /// Gets or sets the estimated total cost of the quotation.
    /// </summary>
    public decimal TotalEstimated { get; set; }

    /// <summary>
    /// Gets or sets a value indicating whether this draft was parsed by the local AI engine.
    /// </summary>
    public bool CreatedByAi { get; set; }

    #endregion

    #region Constructors

    /// <summary>
    /// Required default constructor for Entity Framework Core.
    /// </summary>
    public Quotation() : base()
    {
    }

    /// <summary>
    /// Initializes a new instance of the Quotation class.
    /// </summary>
    public Quotation(Guid customerId, string sourceText, bool createdByAi = true) : base()
    {
        CustomerId = customerId;
        SourceText = sourceText;
        Status = "Draft";
        CreatedByAi = createdByAi;
        TotalEstimated = 0;

        // Register domain event for tracing or AI notifications
        AddDomainEvent(new QuotationCreatedEvent(Id));
    }

    #endregion

    #region Navigation Properties

    /// <summary>
    /// Gets or sets the associated customer profile.
    /// </summary>
    public virtual Customer? Customer { get; set; }

    /// <summary>
    /// Gets or sets the collection of quotation items.
    /// </summary>
    public virtual ICollection<QuotationItem> Items { get; set; } = new List<QuotationItem>();

    #endregion

    #region Domain Methods

    /// <summary>
    /// Adds a line item to the quotation draft and recalculates estimated totals.
    /// </summary>
    public void AddItem(
        Guid? matchedProductId, 
        string rawItemText, 
        int quantity, 
        string unit, 
        decimal unitPrice, 
        decimal confidenceScore)
    {
        if (Status != "Draft")
        {
            throw new InvalidOperationException("Cannot add items to a finalized quotation sheet.");
        }

        Items.Add(new QuotationItem(matchedProductId, rawItemText, quantity, unit, unitPrice, confidenceScore));
        RecalculateTotalEstimated();
    }

    /// <summary>
    /// Updates the total estimated value by summing all lines.
    /// </summary>
    private void RecalculateTotalEstimated()
    {
        TotalEstimated = Items.Sum(i => i.Subtotal);
    }

    /// <summary>
    /// Approves the quotation, transitioning status.
    /// </summary>
    public void Approve()
    {
        if (Status != "Draft")
        {
            throw new InvalidOperationException($"Cannot approve quotation in '{Status}' state.");
        }

        Status = "Approved";
    }

    /// <summary>
    /// Rejects the quotation, transitioning status.
    /// </summary>
    public void Reject()
    {
        if (Status != "Draft")
        {
            throw new InvalidOperationException($"Cannot reject quotation in '{Status}' state.");
        }

        Status = "Rejected";
    }

    #endregion
}
