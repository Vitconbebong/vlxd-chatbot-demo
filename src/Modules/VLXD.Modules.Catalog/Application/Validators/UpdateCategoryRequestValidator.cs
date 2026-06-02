using FluentValidation;
using VLXD.Modules.Catalog.Application.DTOs;

namespace VLXD.Modules.Catalog.Application.Validators;

/// <summary>
/// Validator for UpdateCategoryRequest payloads.
/// </summary>
public class UpdateCategoryRequestValidator : AbstractValidator<UpdateCategoryRequest>
{
    #region Constructors

    /// <summary>
    /// Configures validation rules for category name and other attributes.
    /// </summary>
    public UpdateCategoryRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên phân loại không được để trống.")
            .MaximumLength(100).WithMessage("Tên phân loại không được vượt quá 100 ký tự.");
    }

    #endregion
}
