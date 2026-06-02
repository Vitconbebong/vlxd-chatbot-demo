import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, ShieldCheck, HelpCircle, FileSpreadsheet, Plus, Minus } from 'lucide-react';
import { getProductById } from '../api/catalog';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const addItem = useCartStore((state) => state.addItem);
  const getItemPrice = useCartStore((state) => state.getItemPrice);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    async function loadProduct() {
      try {
        const data = await getProductById(id);
        setProduct(data);
      } catch (err) {
        console.error('Failed to load product details', err);
        toast.error('Không tìm thấy thông tin sản phẩm.');
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-pulse">
        <Skeleton className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-96 w-full rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-2/3 bg-zinc-200 dark:bg-zinc-800" />
            <Skeleton className="h-6 w-1/3 bg-zinc-200 dark:bg-zinc-800" />
            <Skeleton className="h-24 w-full bg-zinc-200 dark:bg-zinc-800" />
            <Skeleton className="h-12 w-1/2 bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Sản phẩm không tồn tại</h2>
        <Link to="/products" className="mt-4 inline-flex items-center text-orange-500 hover:text-orange-400">
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách sản phẩm
        </Link>
      </div>
    );
  }

  const price = getItemPrice(product, user?.customerTier || 'Retail');
  const totalCost = price * quantity;
  const isContractor = user && user.customerTier !== 'Retail';

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.success(`Đã thêm ${quantity} ${product.unitOfMeasure} ${product.name} vào giỏ hàng!`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Back button */}
      <Link to="/products" className="inline-flex items-center text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white text-sm font-medium">
        <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách sản phẩm
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Image Panel */}
        <div>
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.name} 
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 object-cover aspect-video"
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-700 font-black text-4xl select-none uppercase tracking-widest text-center px-4">
              {product.sku}
            </div>
          )}
        </div>

        {/* Product Information */}
        <div className="space-y-6">
          <div>
            <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-655 dark:text-orange-400 border border-orange-500/20">
              {product.categoryName}
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">{product.name}</h1>
            <p className="text-zinc-500 text-xs mt-1">Mã sản phẩm (SKU): {product.sku}</p>
          </div>

          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{product.description}</p>

          {/* Pricing detail */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/20 p-5 space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">Đơn giá bán:</span>
              <div className="text-right">
                <span className="text-2xl font-black text-zinc-900 dark:text-white">{price.toLocaleString('vi-VN')}đ</span>
                <span className="text-xs text-zinc-500 ml-1">/{product.unitOfMeasure}</span>
              </div>
            </div>

            {isContractor && (
              <div className="flex justify-between text-xs text-orange-600 dark:text-orange-400 border-t border-zinc-200 dark:border-zinc-800/80 pt-2 font-medium">
                <span>Cấp tài khoản ưu đãi:</span>
                <span>{user.customerTier} (Đã áp dụng giảm giá)</span>
              </div>
            )}
          </div>

          {/* Wastage calculation info if available */}
          {product.coveragePerPackage && (
            <div className="flex items-center gap-3 rounded-lg bg-orange-50 border border-orange-200 dark:bg-orange-950/20 dark:border-orange-500/10 p-3 text-xs text-orange-700 dark:text-orange-400">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>
                Độ phủ kỹ thuật: {product.coveragePerPackage} m² / {product.unitOfMeasure}. 
                Tỷ lệ hao hụt định mức khuyến nghị: {(product.wastageRate * 100).toFixed(0)}%.
              </span>
            </div>
          )}

          {/* Quantity selector */}
          <div className="flex items-center gap-4 border-t border-zinc-200 dark:border-zinc-800 pt-6">
            <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <button 
                className="p-3 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="px-4 text-sm font-semibold text-zinc-900 dark:text-white min-w-[2rem] text-center">{quantity}</span>
              <button 
                className="p-3 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <Button 
              className="flex-grow bg-orange-600 hover:bg-orange-500 text-white font-semibold shadow-lg shadow-orange-600/10 h-12"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Thêm vào giỏ hàng ({(totalCost).toLocaleString('vi-VN')}đ)
            </Button>
          </div>
        </div>
      </div>

      {/* Specifications & Price Tiers Tab Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-zinc-200 dark:border-zinc-800 pt-12">
        {/* Specs */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-orange-500" />
            Thông số kỹ thuật
          </h3>
          <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900/10">
                {product.specs && product.specs.length > 0 ? (
                  product.specs.map((spec, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 font-medium text-zinc-500 bg-zinc-50 dark:text-zinc-400 dark:bg-zinc-900/30 w-1/3">{spec.specKey}</td>
                      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{spec.specValue}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-3 text-zinc-500 italic text-center" colSpan={2}>
                      Chưa cập nhật thông số kỹ thuật.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Price Tiers Info */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-orange-500" />
            Chương trình chiết khấu đại lý
          </h3>
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/10 p-5 space-y-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Hệ thống VLXD Smart cung cấp các mức giá chiết khấu ưu đãi tự động cho chủ thầu (Contractor) và đại lý phân phối (Dealer). Đăng nhập để tự động áp dụng giá theo phân quyền tài khoản của bạn.
            </p>
            <div className="space-y-2">
              {product.priceTiers && product.priceTiers.map((tier, index) => (
                <div key={index} className="flex justify-between items-center text-xs py-2 border-b border-zinc-200 dark:border-zinc-800 last:border-0">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">{tier.tierName}</span>
                  <span className="text-zinc-500">Mua tối thiểu: {tier.minQuantity} UoM</span>
                  <span className="font-black text-orange-600 dark:text-orange-400">{tier.price.toLocaleString('vi-VN')}đ/{product.unitOfMeasure}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
