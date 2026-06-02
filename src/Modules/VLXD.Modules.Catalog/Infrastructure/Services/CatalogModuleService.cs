using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using VLXD.Modules.Catalog.Infrastructure;
using VLXD.SharedKernel.Application.Contracts;

namespace VLXD.Modules.Catalog.Infrastructure.Services;

/// <summary>
/// Provides cross-module query access to product catalog database structures.
/// </summary>
public class CatalogModuleService : ICatalogModule
{
    #region Fields

    private readonly CatalogDbContext _dbContext;

    #endregion

    #region Constructors

    /// <summary>
    /// Initializes a new instance of the CatalogModuleService class.
    /// </summary>
    public CatalogModuleService(CatalogDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    #endregion

    #region Methods

    /// <summary>
    /// Fetches a product by ID, returning it in the shared contract schema.
    /// </summary>
    public async Task<ProductContractDto?> GetProductByIdAsync(Guid productId)
    {
        var p = await _dbContext.Products
            .Include(x => x.PriceTiers)
            .FirstOrDefaultAsync(x => x.Id == productId);

        if (p == null)
        {
            return null;
        }

        return MapToContractDto(p);
    }

    /// <summary>
    /// Fetches a list of products by their IDs in batch.
    /// </summary>
    public async Task<List<ProductContractDto>> GetProductsByIdsAsync(List<Guid> productIds)
    {
        var products = await _dbContext.Products
            .Include(x => x.PriceTiers)
            .Where(x => productIds.Contains(x.Id))
            .ToListAsync();

        return products.Select(MapToContractDto).ToList();
    }

    /// <summary>
    /// Performs keyword search on active products, returning contracts.
    /// </summary>
    public async Task<List<ProductContractDto>> SearchProductsAsync(string query)
    {
        var searchLower = query.ToLower();
        var products = await _dbContext.Products
            .Include(x => x.PriceTiers)
            .Where(x => x.IsActive && (
                x.Name.Contains(query) ||
                x.Sku.Contains(query) ||
                x.Aliases.Any(a => a.AliasName.Contains(searchLower))
            ))
            .ToListAsync();

        return products.Select(MapToContractDto).ToList();
    }

    /// <summary>
    /// Auto-creates a product during WMS inbound receipt when the product details are provided.
    /// </summary>
    public async Task<Guid> CreateProductFromInboundAsync(CreateProductFromInboundDto dto)
    {
        // Enforce unique SKU check
        var existingProduct = await _dbContext.Products.FirstOrDefaultAsync(p => p.Sku == dto.Sku);
        if (existingProduct != null)
        {
            return existingProduct.Id;
        }

        // Validate or resolve Category ID
        var categoryId = dto.CategoryId;
        if (categoryId == Guid.Empty || !await _dbContext.Categories.AnyAsync(c => c.Id == categoryId))
        {
            var firstCategory = await _dbContext.Categories.FirstOrDefaultAsync();
            if (firstCategory != null)
            {
                categoryId = firstCategory.Id;
            }
            else
            {
                // Create a default category
                var defaultCategory = new Domain.Entities.Category("Chưa phân loại", null, 99);
                _dbContext.Categories.Add(defaultCategory);
                await _dbContext.SaveChangesAsync();
                categoryId = defaultCategory.Id;
            }
        }

        var product = new Domain.Entities.Product(
            dto.Sku,
            dto.Name,
            "Sản phẩm tự động tạo từ phiếu nhập kho",
            categoryId,
            dto.BasePrice,
            dto.UnitOfMeasure,
            null,
            null,
            0.05m
        );

        if (dto.Specifications != null)
        {
            foreach (var spec in dto.Specifications)
            {
                product.Specs.Add(new Domain.Entities.ProductSpec(product.Id, spec.Key, spec.Value));
            }
        }

        _dbContext.Products.Add(product);
        await _dbContext.SaveChangesAsync();

        return product.Id;
    }

    /// <summary>
    /// Gets the count of all active products.
    /// </summary>
    public async Task<int> GetProductsCountAsync()
    {
        return await _dbContext.Products.CountAsync(p => p.IsActive);
    }

    #region Helpers

    private static ProductContractDto MapToContractDto(Domain.Entities.Product p)
    {
        return new ProductContractDto(
            p.Id,
            p.Sku,
            p.Name,
            p.BasePrice,
            p.UnitOfMeasure,
            p.UnitsPerPackage,
            p.CoveragePerPackage,
            p.WastageRate,
            p.PriceTiers.Select(t => new PriceTierContractDto(t.TierName, t.Price, t.MinQuantity)).ToList()
        );
    }

    #endregion

    #endregion
}
