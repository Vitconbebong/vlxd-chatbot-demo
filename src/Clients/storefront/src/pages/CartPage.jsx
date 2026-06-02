import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, Minus, Plus } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, getCartTotal, getItemPrice } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

  const userTier = user?.customerTier || 'Retail';
  const total = getCartTotal(userTier);

  const handleCheckoutClick = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=checkout');
    } else {
      navigate('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Giỏ hàng của bạn đang trống</h2>
          <p className="text-sm text-zinc-500">Hãy thêm một vài vật tư xây dựng để bắt đầu đặt hàng.</p>
        </div>
        <Link to="/products">
          <Button className="bg-orange-600 hover:bg-orange-500 text-white font-semibold">
            Xem danh sách sản phẩm
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Giỏ hàng của bạn</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items list */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const product = item.product;
            const price = getItemPrice(product, userTier);
            
            return (
              <div 
                key={product.id} 
                className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/20 shadow-sm shadow-zinc-100/50 dark:shadow-none"
              >
                {/* Fallback visual block or image */}
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name} 
                    className="h-16 w-16 rounded-lg object-cover bg-zinc-100 dark:bg-zinc-900"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 text-[10px] font-black text-zinc-500 uppercase select-none">
                    {product.sku}
                  </div>
                )}

                {/* Details */}
                <div className="flex-grow min-w-0">
                  <h3 className="font-semibold text-zinc-900 dark:text-white truncate text-sm">{product.name}</h3>
                  <p className="text-xs text-zinc-500">{product.categoryName}</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-bold">
                    {price.toLocaleString('vi-VN')}đ / {product.unitOfMeasure}
                  </p>
                </div>

                {/* Counter */}
                <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                  <button 
                    className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors"
                    onClick={() => updateQuantity(product.id, item.quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="px-2 text-xs font-semibold text-zinc-850 dark:text-white w-8 text-center">{item.quantity}</span>
                  <button 
                    className="p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors"
                    onClick={() => updateQuantity(product.id, item.quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                {/* Subtotal */}
                <div className="text-right min-w-[5rem]">
                  <span className="text-sm font-bold text-zinc-900 dark:text-white">
                    {(price * item.quantity).toLocaleString('vi-VN')}đ
                  </span>
                </div>

                {/* Delete button */}
                <button 
                  className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                  onClick={() => removeItem(product.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Order Summary box */}
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/10 p-6 h-fit space-y-6 shadow-sm shadow-zinc-100/50 dark:shadow-none">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-3">Tóm tắt đơn hàng</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
              <span>Số lượng sản phẩm:</span>
              <span className="text-zinc-900 dark:text-white font-medium">
                {items.reduce((sum, item) => sum + item.quantity, 0)} mặt hàng
              </span>
            </div>
            
            {user && user.customerTier !== 'Retail' && (
              <div className="flex justify-between text-orange-600 dark:text-orange-400">
                <span>Ưu đãi hội viên:</span>
                <span>{user.customerTier} (Đã giảm giá)</span>
              </div>
            )}

            <div className="flex justify-between text-zinc-550 dark:text-zinc-400 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <span>Tạm tính:</span>
              <span className="text-zinc-900 dark:text-white font-medium">{total.toLocaleString('vi-VN')}đ</span>
            </div>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 flex justify-between items-baseline">
            <span className="text-base font-bold text-zinc-900 dark:text-white">Tổng cộng:</span>
            <span className="text-2xl font-black text-orange-500">{total.toLocaleString('vi-VN')}đ</span>
          </div>

          <Button 
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold shadow-lg shadow-orange-600/20 py-6"
            onClick={handleCheckoutClick}
          >
            Tiến hành đặt hàng
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          {!isAuthenticated && (
            <p className="text-[10px] text-zinc-500 text-center">
              * Vui lòng đăng nhập để áp dụng chiết khấu chủ thầu/đại lý (nếu có).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
