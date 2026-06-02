import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, ShoppingCart, Tag } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/button';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const addItem = useCartStore((state) => state.addItem);
  const getItemPrice = useCartStore((state) => state.getItemPrice);
  const user = useAuthStore((state) => state.user);

  const price = getItemPrice(product, user?.customerTier || 'Retail');
  const hasDiscount = user && user.customerTier !== 'Retail';

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
    toast.success(`Đã thêm ${product.name} vào giỏ hàng!`);
  };

  // Safe fallback image block
  const imagePlaceholder = (
    <div className="relative flex h-48 w-full items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-900 dark:to-zinc-800 rounded-t-lg">
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      <span className="text-4xl font-black text-zinc-400 dark:text-zinc-700 select-none tracking-widest uppercase text-center w-full px-4">
        {product.sku}
      </span>
      {hasDiscount && (
        <span className="absolute top-3 left-3 flex items-center gap-1 rounded bg-orange-600 px-2 py-0.5 text-xs font-semibold text-white shadow-lg">
          <Tag className="h-3 w-3" />
          Giá ưu đãi
        </span>
      )}
    </div>
  );

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/80 transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/30 hover:shadow-xl hover:shadow-zinc-200/50 dark:hover:shadow-none">
      <Link to={`/products/${product.id}`} className="block">
        {/* Product Image */}
        {product.imageUrl ? (
          <div className="relative overflow-hidden rounded-t-xl h-48">
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent" />
          </div>
        ) : (
          imagePlaceholder
        )}

        {/* Details */}
        <div className="p-5 flex-grow">
          <span className="text-[10px] uppercase font-semibold text-orange-600 dark:text-orange-500 tracking-wider">
            {product.categoryName || 'Vật liệu'}
          </span>
          <h3 className="mt-1 font-semibold text-zinc-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 line-clamp-1 transition-colors">
            {product.name}
          </h3>
          <p className="mt-1 text-xs text-zinc-650 dark:text-zinc-400 line-clamp-2 min-h-[2.5rem]">
            {product.description || 'Chưa có mô tả chi tiết sản phẩm.'}
          </p>

          <div className="mt-4 flex items-baseline justify-between border-t border-zinc-200 dark:border-zinc-800/60 pt-3">
            <div>
              <span className="text-lg font-bold text-zinc-900 dark:text-white">
                {price.toLocaleString('vi-VN')}đ
              </span>
              <span className="text-xs text-zinc-500 ml-1">/{product.unitOfMeasure}</span>
            </div>
            {hasDiscount && (
              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 line-through">
                {product.basePrice.toLocaleString('vi-VN')}đ
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Cart Button */}
      <div className="px-5 pb-5">
        <Button 
          className="w-full bg-zinc-100 hover:bg-orange-600 text-zinc-800 hover:text-white dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-orange-600 dark:hover:text-white transition-all duration-300 font-medium"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Thêm vào giỏ
        </Button>
      </div>
    </div>
  );
}
