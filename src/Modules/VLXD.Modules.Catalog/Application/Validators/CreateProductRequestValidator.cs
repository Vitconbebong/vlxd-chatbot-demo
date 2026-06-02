using FluentValidation;
using VLXD.Modules.Catalog.Application.DTOs;

namespace VLXD.Modules.Catalog.Application.Validators;

/// <summary>
/// Validator for CreateProductRequest payloads.
/// </summary>
public class CreateProductRequestValidator : AbstractValidator<CreateProductRequest>
{
    #region Constructors

    /// <summary>
    /// Configures rules for SKU formats, required fields, and boundary constraints.
    /// </summary>
    public CreateProductRequestValidator()
    {
        RuleFor(x => x.Sku)
            .NotEmpty()
            .MaximumLength(50)
            .Matches(@"^VLXD-[A-Z0-9\-]+$").WithMessage("SKU must follow the format 'VLXD-XXXX' containing letters, numbers, or dashes.");

        RuleFor(x => x.Name)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.Description)
            .NotEmpty();

        RuleFor(x => x.CategoryId)
            .NotEmpty();

        RuleFor(x => x.BasePrice)
            .GreaterThan(0).WithMessage("Base price must be greater than zero.");

        RuleFor(x => x.UnitOfMeasure)
            .NotEmpty()
            .MaximumLength(20);

        RuleFor(x => x.WastageRate)
            .InclusiveBetween(0, 1).WithMessage("Wastage rate must be a multiplier between 0.00 (0%) and 1.00 (100%).");

        RuleFor(x => x.ImageUrl)
            .MaximumLength(500);
    }

    #endregion
}
