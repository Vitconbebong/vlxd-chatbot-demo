import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Eye } from 'lucide-react';
import { getProducts, getCategories } from '../api/catalog';
import ProductGrid from '../components/product/ProductGrid';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState(searchParams.get('search') || '');
  
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [totalPages, setTotalPages] = useState(1);

  const selectedCategoryId = searchParams.get('categoryId') || '';

  // Load Categories on mount
  useEffect(() => {
    async function loadCats() {
      try {
        const catData = await getCategories();
        setCategories(catData);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    }
    loadCats();
  }, []);

  // Load Products when searchParams change
  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const queryParams = {
          page,
          pageSize: 8,
          categoryId: selectedCategoryId || undefined,
          search: searchParams.get('search') || undefined
        };
        const result = await getProducts(queryParams);
        setProducts(result.items || []);
        setTotalPages(result.totalPages || 1);
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [selectedCategoryId, searchParams, page]);

  const handleCategorySelect = (categoryId) => {
    setPage(1);
    const params = new URLSearchParams(searchParams);
    if (categoryId) {
      params.set('categoryId', categoryId);
    } else {
      params.delete('categoryId');
    }
    setSearchParams(params);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    const params = new URLSearchParams(searchParams);
    if (searchText.trim()) {
      params.set('search', searchText);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      const params = new URLSearchParams(searchParams);
      params.set('page', newPage.toString());
      setSearchParams(params);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Filter */}
        <aside className="w-full md:w-64 shrink-0 space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/10 p-5 space-y-6">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-orange-500" />
              <span>Bộ lọc tìm kiếm</span>
            </h3>

            {/* Category Filter */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Danh mục sản phẩm</h4>
              <div className="flex flex-wrap md:flex-col gap-2">
                <button
                  onClick={() => handleCategorySelect('')}
                  className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    !selectedCategoryId 
                      ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20' 
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent'
                  }`}
                >
                  Tất cả sản phẩm
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      selectedCategoryId === cat.id 
                        ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20' 
                        : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Product Grid Area */}
        <div className="flex-grow space-y-6">
          {/* Top Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-md">
              <Input
                type="text"
                placeholder="Tìm sản phẩm, xi măng, sắt thép..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-500 pr-10 focus-visible:ring-orange-500 focus-visible:border-orange-500 rounded-lg text-sm"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-white">
                <Search className="h-4 w-4" />
              </button>
            </form>
            
            <div className="text-xs text-zinc-500 self-end sm:self-center font-medium">
              Hiển thị {products.length} sản phẩm
            </div>
          </div>

          {/* Grid view */}
          <ProductGrid products={products} loading={loading} />

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-8 border-t border-zinc-200 dark:border-zinc-800">
              <Button
                variant="outline"
                size="sm"
                className="border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-white"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                Trước
              </Button>
              
              {Array.from({ length: totalPages }).map((_, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant={page === index + 1 ? 'default' : 'outline'}
                  className={page === index + 1 ? 'bg-orange-600 hover:bg-orange-500 text-white' : 'border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-white'}
                  onClick={() => handlePageChange(index + 1)}
                >
                  {index + 1}
                </Button>
              ))}

              <Button
                variant="outline"
                size="sm"
                className="border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-white"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                Sau
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
