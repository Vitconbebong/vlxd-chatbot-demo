using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using VLXD.Modules.Catalog.Application.DTOs;
using VLXD.Modules.Catalog.Domain.Entities;
using VLXD.Modules.Catalog.Infrastructure;
using VLXD.SharedKernel.Application;

namespace VLXD.Modules.Catalog.Api;

/// <summary>
/// Exposes Catalog module REST endpoints via ASP.NET Core Minimal APIs.
/// </summary>
public static class CatalogEndpoints
{
    #region Methods

    /// <summary>
    /// Maps all catalog endpoints into the main WebApplication routing table.
    /// </summary>
    public static IEndpointRouteBuilder MapCatalogEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var group = endpoints.MapGroup("/api/catalog").WithTags("Catalog");

        // Public retrieval endpoints
        group.MapGet("/products", GetProductsAsync);
        group.MapGet("/products/{id:guid}", GetProductByIdAsync);
        group.MapGet("/products/search", SearchProductsAsync);
        group.MapGet("/categories", GetCategoriesAsync);

        // Protected administrative endpoints (Admin only)
        group.MapPost("/products", CreateProductAsync)
            .RequireAuthorization(policy => policy.RequireRole("Admin"));
            
        group.MapPut("/products/{id:guid}", UpdateProductAsync)
            .RequireAuthorization(policy => policy.RequireRole("Admin"));
            
        group.MapDelete("/products/{id:guid}", DeleteProductAsync)
            .RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapPost("/categories", CreateCategoryAsync)
            .RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapPut("/categories/{id:guid}", UpdateCategoryAsync)
            .RequireAuthorization(policy => policy.RequireRole("Admin"));

        group.MapDelete("/categories/{id:guid}", DeleteCategoryAsync)
            .RequireAuthorization(policy => policy.RequireRole("Admin"));

        return endpoints;
    }

    #region Endpoint Handlers

    private static async Task<IResult> GetProductsAsync(
        CatalogDbContext db,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] Guid? categoryId = null,
        [FromQuery] string? search = null,
        [FromQuery] bool? isActive = null)
    {
        var query = db.Products
            .Include(p => p.Category)
            .Include(p => p.Specs)
            .Include(p => p.Aliases)
            .Include(p => p.PriceTiers)
            .AsQueryable();

        if (categoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == categoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(p => p.Name.Contains(search) || 
                                     p.Sku.Contains(search) || 
                                     p.Aliases.Any(a => a.AliasName.Contains(searchLower)));
        }

        if (isActive.HasValue)
        {
            query = query.Where(p => p.IsActive == isActive.Value);
        }

        int totalCount = await query.CountAsync();
        var items = await query
            .OrderBy(p => p.Sku)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = items.Select(MapToProductDto).ToList();
        return Results.Ok(new PagedResult<ProductDto>(dtos, totalCount, page, pageSize));
    }

    private static async Task<IResult> GetProductByIdAsync(CatalogDbContext db, Guid id)
    {
        var product = await db.Products
            .Include(p => p.Category)
            .Include(p => p.Specs)
            .Include(p => p.Aliases)
            .Include(p => p.PriceTiers)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
        {
            return Results.NotFound(new { Message = $"Product with ID {id} not found." });
        }

        return Results.Ok(MapToProductDto(product));
    }

    private static async Task<IResult> SearchProductsAsync(CatalogDbContext db, [FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return Results.BadRequest(new { Message = "Search query parameter 'q' is required." });
        }

        var searchLower = q.ToLower();
        var products = await db.Products
            .Include(p => p.Category)
            .Include(p => p.Specs)
            .Include(p => p.Aliases)
            .Include(p => p.PriceTiers)
            .Where(p => p.IsActive && (
                p.Name.Contains(q) ||
                p.Sku.Contains(q) ||
                p.Description.Contains(q) ||
                p.Aliases.Any(a => a.AliasName.Contains(searchLower))
            ))
            .ToListAsync();

        var dtos = products.Select(MapToProductDto).ToList();
        return Results.Ok(dtos);
    }

    private static async Task<IResult> GetCategoriesAsync(
        CatalogDbContext db,
        [FromServices] IMemoryCache memoryCache)
    {
        const string CategoriesCacheKey = "catalog_categories_tree";
        
        var rootCategories = await memoryCache.GetOrCreateAsync(CategoriesCacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30);

            // Load all categories to build hierarchical tree in memory
            var categories = await db.Categories
                .Include(c => c.Children)
                .ToListAsync();

            // Top-level categories have no parent
            return categories
                .Where(c => c.ParentId == null)
                .OrderBy(c => c.SortOrder)
                .Select(MapToCategoryDto)
                .ToList();
        });

        return Results.Ok(rootCategories);
    }

    private static async Task<IResult> CreateProductAsync(
        CatalogDbContext db,
        IValidator<CreateProductRequest> validator,
        [FromBody] CreateProductRequest request)
    {
        var validationResult = await validator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return Results.BadRequest(validationResult.ToDictionary());
        }

        // Enforce unique SKU validation
        bool skuExists = await db.Products.AnyAsync(p => p.Sku == request.Sku);
        if (skuExists)
        {
            return Results.Conflict(new { Message = $"Product SKU '{request.Sku}' already exists." });
        }

        // Validate Category exists
        bool categoryExists = await db.Categories.AnyAsync(c => c.Id == request.CategoryId);
        if (!categoryExists)
        {
            return Results.BadRequest(new { Message = $"Category with ID {request.CategoryId} does not exist." });
        }

        var product = new Product(
            request.Sku,
            request.Name,
            request.Description,
            request.CategoryId,
            request.BasePrice,
            request.UnitOfMeasure,
            request.UnitsPerPackage,
            request.CoveragePerPackage,
            request.WastageRate,
            request.ImageUrl
        );

        // Add sub-entities
        foreach (var spec in request.Specs)
        {
            product.Specs.Add(new ProductSpec(product.Id, spec.SpecKey, spec.SpecValue));
        }

        foreach (var alias in request.Aliases)
        {
            product.Aliases.Add(new ProductAlias(product.Id, alias.AliasName));
        }

        foreach (var tier in request.PriceTiers)
        {
            product.PriceTiers.Add(new PriceTier(product.Id, tier.TierName, tier.Price, tier.MinQuantity));
        }

        db.Products.Add(product);
        await db.SaveChangesAsync();

        // Reload to load navigation properties cleanly for output
        var savedProduct = await db.Products
            .Include(p => p.Category)
            .Include(p => p.Specs)
            .Include(p => p.Aliases)
            .Include(p => p.PriceTiers)
            .FirstAsync(p => p.Id == product.Id);

        return Results.Created($"/api/catalog/products/{product.Id}", MapToProductDto(savedProduct));
    }

    private static async Task<IResult> UpdateProductAsync(
        CatalogDbContext db,
        IValidator<UpdateProductRequest> validator,
        Guid id,
        [FromBody] UpdateProductRequest request)
    {
        var validationResult = await validator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return Results.BadRequest(validationResult.ToDictionary());
        }

        var product = await db.Products
            .Include(p => p.Specs)
            .Include(p => p.Aliases)
            .Include(p => p.PriceTiers)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
        {
            return Results.NotFound(new { Message = $"Product with ID {id} not found." });
        }

        // Validate Category exists
        bool categoryExists = await db.Categories.AnyAsync(c => c.Id == request.CategoryId);
        if (!categoryExists)
        {
            return Results.BadRequest(new { Message = $"Category with ID {request.CategoryId} does not exist." });
        }

        // Update properties
        product.Name = request.Name;
        product.Description = request.Description;
        product.CategoryId = request.CategoryId;
        product.BasePrice = request.BasePrice;
        product.UnitOfMeasure = request.UnitOfMeasure;
        product.UnitsPerPackage = request.UnitsPerPackage;
        product.CoveragePerPackage = request.CoveragePerPackage;
        product.WastageRate = request.WastageRate;
        product.ImageUrl = request.ImageUrl;
        product.IsActive = request.IsActive;

        // Recreate specs
        db.ProductSpecs.RemoveRange(product.Specs);
        product.Specs.Clear();
        foreach (var spec in request.Specs)
        {
            product.Specs.Add(new ProductSpec(product.Id, spec.SpecKey, spec.SpecValue));
        }

        // Recreate aliases
        db.ProductAliases.RemoveRange(product.Aliases);
        product.Aliases.Clear();
        foreach (var alias in request.Aliases)
        {
            product.Aliases.Add(new ProductAlias(product.Id, alias.AliasName));
        }

        // Recreate price tiers
        db.PriceTiers.RemoveRange(product.PriceTiers);
        product.PriceTiers.Clear();
        foreach (var tier in request.PriceTiers)
        {
            product.PriceTiers.Add(new PriceTier(product.Id, tier.TierName, tier.Price, tier.MinQuantity));
        }

        await db.SaveChangesAsync();

        // Reload navigation parameters
        var updatedProduct = await db.Products
            .Include(p => p.Category)
            .Include(p => p.Specs)
            .Include(p => p.Aliases)
            .Include(p => p.PriceTiers)
            .FirstAsync(p => p.Id == product.Id);

        return Results.Ok(MapToProductDto(updatedProduct));
    }

    private static async Task<IResult> DeleteProductAsync(CatalogDbContext db, Guid id)
    {
        var product = await db.Products.FindAsync(id);
        if (product == null)
        {
            return Results.NotFound(new { Message = $"Product with ID {id} not found." });
        }

        // Standard soft-delete behavior for Catalog consistency
        product.IsActive = false;
        await db.SaveChangesAsync();

        return Results.NoContent();
    }

    private static async Task<IResult> CreateCategoryAsync(
        [FromServices] CatalogDbContext db,
        [FromServices] IValidator<CreateCategoryRequest> validator,
        [FromServices] IMemoryCache memoryCache,
        [FromBody] CreateCategoryRequest request)
    {
        var validationResult = await validator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return Results.BadRequest(validationResult.ToDictionary());
        }

        if (request.ParentId.HasValue)
        {
            var parentExists = await db.Categories.AnyAsync(c => c.Id == request.ParentId.Value);
            if (!parentExists)
            {
                return Results.BadRequest(new { Message = $"Parent category with ID {request.ParentId} does not exist." });
            }
        }

        var category = new Category(request.Name, request.ParentId, request.SortOrder);
        db.Categories.Add(category);
        await db.SaveChangesAsync();

        // Invalidate memory cache
        memoryCache.Remove("catalog_categories_tree");

        return Results.Created($"/api/catalog/categories/{category.Id}", new CategoryDto(category.Id, category.Name, category.ParentId, category.SortOrder, new List<CategoryDto>().AsReadOnly()));
    }

    private static async Task<IResult> UpdateCategoryAsync(
        [FromServices] CatalogDbContext db,
        [FromServices] IValidator<UpdateCategoryRequest> validator,
        [FromServices] IMemoryCache memoryCache,
        [FromRoute] Guid id,
        [FromBody] UpdateCategoryRequest request)
    {
        var validationResult = await validator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return Results.BadRequest(validationResult.ToDictionary());
        }

        var category = await db.Categories.FindAsync(id);
        if (category == null)
        {
            return Results.NotFound(new { Message = $"Category with ID {id} not found." });
        }

        if (request.ParentId.HasValue)
        {
            if (request.ParentId.Value == id)
            {
                return Results.BadRequest(new { Message = "A category cannot be its own parent." });
            }
            
            var parentExists = await db.Categories.AnyAsync(c => c.Id == request.ParentId.Value);
            if (!parentExists)
            {
                return Results.BadRequest(new { Message = $"Parent category with ID {request.ParentId} does not exist." });
            }
        }

        category.Name = request.Name;
        category.ParentId = request.ParentId;
        category.SortOrder = request.SortOrder;

        await db.SaveChangesAsync();

        // Invalidate memory cache
        memoryCache.Remove("catalog_categories_tree");

        return Results.Ok(new CategoryDto(category.Id, category.Name, category.ParentId, category.SortOrder, new List<CategoryDto>().AsReadOnly()));
    }

    private static async Task<IResult> DeleteCategoryAsync(
        [FromServices] CatalogDbContext db,
        [FromServices] IMemoryCache memoryCache,
        [FromRoute] Guid id)
    {
        var category = await db.Categories.Include(c => c.Children).FirstOrDefaultAsync(c => c.Id == id);
        if (category == null)
        {
            return Results.NotFound(new { Message = $"Category with ID {id} not found." });
        }

        // Check if it has child categories
        if (category.Children.Any())
        {
            return Results.BadRequest(new { Message = "Cannot delete a category that has subcategories." });
        }

        // Check if it has products cataloged under it
        var hasProducts = await db.Products.AnyAsync(p => p.CategoryId == id);
        if (hasProducts)
        {
            return Results.BadRequest(new { Message = "Cannot delete a category that contains products." });
        }

        db.Categories.Remove(category);
        await db.SaveChangesAsync();

        // Invalidate memory cache
        memoryCache.Remove("catalog_categories_tree");

        return Results.NoContent();
    }

    #endregion

    #region Mapping Helpers

    private static ProductDto MapToProductDto(Product p)
    {
        return new ProductDto(
            p.Id,
            p.Sku,
            p.Name,
            p.Description,
            p.CategoryId,
            p.Category?.Name ?? string.Empty,
            p.BasePrice,
            p.UnitOfMeasure,
            p.UnitsPerPackage,
            p.CoveragePerPackage,
            p.WastageRate,
            p.ImageUrl,
            p.IsActive,
            p.Specs.Select(s => new ProductSpecDto(s.SpecKey, s.SpecValue)).ToList().AsReadOnly(),
            p.Aliases.Select(a => new ProductAliasDto(a.AliasName)).ToList().AsReadOnly(),
            p.PriceTiers.Select(pt => new PriceTierDto(pt.TierName, pt.Price, pt.MinQuantity)).ToList().AsReadOnly(),
            p.CreatedAt,
            p.UpdatedAt
        );
    }

    private static CategoryDto MapToCategoryDto(Category c)
    {
        return new CategoryDto(
            c.Id,
            c.Name,
            c.ParentId,
            c.SortOrder,
            c.Children.Select(MapToCategoryDto).ToList().AsReadOnly()
        );
    }

    #endregion

    #endregion
}
