import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { placeOrder } from '../api/sales';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getCartTotal, getItemPrice, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

  const [address, setAddress] = useState(user?.address || '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redirect if not logged in or cart empty
  if (!isAuthenticated) {
    return <Navigate to="/login?redirect=checkout" replace />;
  }

  if (items.length === 0) {
    return <Navigate to="/products" replace />;
  }

  const userTier = user?.customerTier || 'Retail';
  const total = getCartTotal(userTier);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address.trim()) {
      toast.error('Vui lòng nhập địa chỉ giao hàng.');
      return;
    }

    setSubmitting(true);
    try {
      const orderItems = items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity
      }));

      const payload = {
        deliveryAddress: address,
        notes: notes,
        items: orderItems
      };

      const newOrder = await placeOrder(payload);
      toast.success('Đặt hàng thành công!');
      clearCart();
      navigate(`/orders/${newOrder.id}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi đặt hàng.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white">Thanh toán đơn hàng</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Checkout Form */}
        <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/10 p-6 space-y-6 shadow-sm shadow-zinc-100/50 dark:shadow-none">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-3">Thông tin giao hàng</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">Họ và tên người nhận</label>
              <Input
                type="text"
                value={user?.fullName || ''}
                disabled
                className="bg-zinc-50 border-zinc-200 text-zinc-800 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 disabled:opacity-90 rounded-lg text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">Số điện thoại</label>
              <Input
                type="text"
                value={user?.userName || ''} // In this template, email/phone is used as userName
                disabled
                className="bg-zinc-50 border-zinc-200 text-zinc-800 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 disabled:opacity-90 rounded-lg text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase">Địa chỉ giao hàng *</label>
              <Input
                type="text"
                placeholder="Nhập địa chỉ chi tiết nơi nhận vật tư"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-650 rounded-lg text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase">Ghi chú giao hàng</label>
              <Textarea
                placeholder="Ví dụ: Giao giờ hành chính, xe cẩu tự hành, dỡ hàng tại sân..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-650 rounded-lg text-sm"
              />
            </div>

            <Button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold shadow-lg shadow-orange-600/20 py-6 mt-4"
            >
              {submitting ? 'Đang gửi đơn hàng...' : 'Xác nhận đặt hàng'}
            </Button>
          </form>
        </div>

        {/* Order Items Summary */}
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/10 p-6 h-fit space-y-4 shadow-sm shadow-zinc-100/50 dark:shadow-none">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-3">Chi tiết vật tư</h3>
          
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800 max-h-72 overflow-y-auto pr-2 space-y-2">
            {items.map((item) => {
              const price = getItemPrice(item.product, userTier);
              return (
                <div key={item.product.id} className="flex justify-between py-2 text-xs">
                  <div className="min-w-0 flex-grow pr-3">
                    <p className="font-semibold text-zinc-800 dark:text-zinc-300 truncate">{item.product.name}</p>
                    <p className="text-zinc-500 text-[10px]">Số lượng: {item.quantity} {item.product.unitOfMeasure}</p>
                  </div>
                  <span className="font-bold text-zinc-900 dark:text-white shrink-0">
                    {(price * item.quantity).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              );
            })}
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
              <span>Hội viên:</span>
              <span className="text-orange-600 dark:text-orange-400 font-medium uppercase">{userTier}</span>
            </div>
            <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
              <span>Tạm tính:</span>
              <span className="text-zinc-900 dark:text-white font-medium">{total.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <span className="text-base font-bold text-zinc-900 dark:text-white">Tổng cộng:</span>
              <span className="text-xl font-black text-orange-500">{total.toLocaleString('vi-VN')}đ</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
