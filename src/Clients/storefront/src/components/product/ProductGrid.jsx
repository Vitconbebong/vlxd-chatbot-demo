import React from 'react';
import ProductCard from './ProductCard';
import { Skeleton } from '../ui/skeleton';

export default function ProductGrid({ products, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
            <Skeleton className="h-48 w-full rounded-t-xl bg-zinc-200 dark:bg-zinc-800" />
            <Skeleton className="h-4 w-2/3 bg-zinc-200 dark:bg-zinc-800" />
            <Skeleton className="h-4 w-full bg-zinc-200 dark:bg-zinc-800" />
            <Skeleton className="h-10 w-full rounded-md bg-zinc-200 dark:bg-zinc-800 mt-2" />
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium text-zinc-500 dark:text-zinc-400">Không tìm thấy sản phẩm nào.</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-500 mt-1">Vui lòng thử lại với từ khóa tìm kiếm khác hoặc danh mục khác.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
