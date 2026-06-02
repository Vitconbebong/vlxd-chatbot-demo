using FluentValidation;
using VLXD.Modules.Catalog.Application.DTOs;

namespace VLXD.Modules.Catalog.Application.Validators;

/// <summary>
/// Validator for UpdateProductRequest payloads.
/// </summary>
public class UpdateProductRequestValidator : AbstractValidator<UpdateProductRequest>
{
    #region Constructors

    /// <summary>
    /// Configures validation rules for updating an existing product.
    /// </summary>
    public UpdateProductRequestValidator()
    {
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
