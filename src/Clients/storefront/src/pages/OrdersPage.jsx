import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { getOrders } from '../api/sales';
import { useAuthStore } from '../store/authStore';
import { Eye, Clock, ShoppingBag } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';

export default function OrdersPage() {
  const { isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function loadOrders() {
      try {
        const data = await getOrders();
        setOrders(data);
      } catch (err) {
        console.error('Failed to load orders', err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-6 animate-pulse">
        <Skeleton className="h-10 w-48 bg-zinc-200 dark:bg-zinc-800" />
        <Skeleton className="h-32 w-full bg-zinc-200 dark:bg-zinc-800" />
        <Skeleton className="h-32 w-full bg-zinc-200 dark:bg-zinc-800" />
      </div>
    );
  }

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'bg-zinc-100 text-zinc-650 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
      case 'confirmed': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'delivering': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'completed': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      default: return 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-500 dark:border-zinc-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'Yêu cầu đặt';
      case 'confirmed': return 'Đã xác nhận';
      case 'delivering': return 'Đang vận chuyển';
      case 'completed': return 'Thành công';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white">Lịch sử mua hàng</h1>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/10 p-12 text-center space-y-4 shadow-sm shadow-zinc-100/50 dark:shadow-none">
          <div className="mx-auto w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center text-zinc-500">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Bạn chưa thực hiện đơn đặt hàng nào.</p>
          <Link to="/products">
            <Button className="bg-orange-600 hover:bg-orange-500 text-white">
              Mua sắm ngay
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div 
              key={order.id} 
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/10 dark:hover:bg-zinc-900/30 hover:border-orange-500/20 transition-all shadow-sm shadow-zinc-100/50 dark:shadow-none"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-zinc-900 dark:text-white text-sm">{order.orderNumber}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadgeClass(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
                <p className="text-xs text-zinc-500">
                  Ngày đặt: {new Date(order.createdAt).toLocaleDateString('vi-VN')} | Địa chỉ: {order.deliveryAddress}
                </p>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-zinc-200 dark:border-zinc-800 pt-3 sm:pt-0">
                <div className="text-right">
                  <p className="text-[10px] text-zinc-500">Tổng thanh toán</p>
                  <p className="font-extrabold text-orange-500 text-sm">
                    {order.totalAmount.toLocaleString('vi-VN')}đ
                  </p>
                </div>
                <Link to={`/orders/${order.id}`}>
                  <Button variant="outline" size="sm" className="border-zinc-200 text-zinc-650 hover:text-zinc-900 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-800">
                    <Eye className="mr-1.5 h-4 w-4 text-orange-500" /> Chi tiết
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
