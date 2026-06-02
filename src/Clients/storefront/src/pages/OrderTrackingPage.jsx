import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Truck, ShieldAlert, CheckCircle, Navigation, MapPin } from 'lucide-react';
import { getOrderById, getDeliveryByOrderId } from '../api/sales';
import { Skeleton } from '../components/ui/skeleton';
import toast from 'react-hot-toast';

export default function OrderTrackingPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pollingInterval, setPollingInterval] = useState(null);

  const loadData = async () => {
    try {
      const orderData = await getOrderById(id);
      setOrder(orderData);
      
      if (orderData.status.toLowerCase() === 'delivering' || orderData.status.toLowerCase() === 'completed') {
        try {
          const deliveryData = await getDeliveryByOrderId(id);
          setDelivery(deliveryData);
        } catch (e) {
          // If no delivery is created yet, just keep it null
          setDelivery(null);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Poll coordinates and status updates every 5 seconds if order is active
    const interval = setInterval(() => {
      loadData();
    }, 5000);

    setPollingInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-pulse">
        <Skeleton className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800" />
        <Skeleton className="h-10 w-1/3 bg-zinc-200 dark:bg-zinc-800" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full bg-zinc-200 dark:bg-zinc-800" />
            <Skeleton className="h-48 w-full bg-zinc-200 dark:bg-zinc-800" />
          </div>
          <Skeleton className="h-96 w-full bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Đơn hàng không tồn tại</h2>
        <Link to="/products" className="mt-4 inline-flex items-center text-orange-500 hover:text-orange-400">
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại cửa hàng
        </Link>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'text-zinc-550 border-zinc-200 bg-zinc-50 dark:text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/50';
      case 'confirmed': return 'text-amber-600 border-amber-500/20 bg-amber-500/5 dark:text-amber-400';
      case 'delivering': return 'text-blue-600 border-blue-500/20 bg-blue-500/5 dark:text-blue-400';
      case 'completed': return 'text-emerald-600 border-emerald-500/20 bg-emerald-500/5 dark:text-emerald-400';
      case 'cancelled': return 'text-red-600 border-red-500/20 bg-red-500/5 dark:text-red-400';
      default: return 'text-zinc-550 border-zinc-200 bg-zinc-50 dark:text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/50';
    }
  };

  const getStatusLabel = (status) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'Yêu cầu đặt';
      case 'confirmed': return 'Đã xác nhận & Chờ xếp kho';
      case 'delivering': return 'Đang vận chuyển';
      case 'completed': return 'Giao hàng thành công';
      case 'cancelled': return 'Đã hủy đơn';
      default: return status;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Back link */}
      <Link to="/products" className="inline-flex items-center text-zinc-550 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white text-sm font-medium">
        <ArrowLeft className="mr-2 h-4 w-4" /> Tiếp tục xem sản phẩm
      </Link>

      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-900 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-white">Theo dõi đơn hàng</h1>
          <p className="text-zinc-500 text-sm mt-1">Mã số đơn: {order.orderNumber}</p>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-bold ${getStatusColor(order.status)}`}>
          <Clock className="h-4 w-4" />
          {getStatusLabel(order.status)}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left pane: Details and items list */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Realtime Delivery Tracker Panel */}
          {delivery && (
            <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/10 p-6 space-y-6 shadow-sm shadow-zinc-100/50 dark:shadow-none">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Truck className="h-5 w-5 text-orange-500 animate-bounce" />
                <span>Định vị giao nhận thời gian thực</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Delivery details info */}
                <div className="space-y-4 text-sm">
                  <div>
                    <span className="text-zinc-500 block text-xs uppercase font-semibold">Tên tài xế</span>
                    <span className="font-bold text-zinc-900 dark:text-white">{delivery.driverName}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-xs uppercase font-semibold">Số điện thoại lái xe</span>
                    <a href={`tel:${delivery.driverPhone}`} className="font-bold text-orange-500 hover:underline">
                      {delivery.driverPhone}
                    </a>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-xs uppercase font-semibold">Biển số xe cẩu</span>
                    <span className="font-bold text-zinc-900 dark:text-white">{delivery.plateNumber}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 block text-xs uppercase font-semibold">Địa điểm nhận hàng</span>
                    <span className="text-zinc-700 dark:text-zinc-300">{delivery.deliveryAddress}</span>
                  </div>
                </div>

                {/* GPS Tracker simulation visualizer */}
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 p-4 flex flex-col justify-between h-48 relative overflow-hidden">
                  <div className="absolute inset-0 bg-grid-pattern opacity-5" />
                  
                  <div className="flex justify-between items-start z-10">
                    <span className="text-[10px] bg-orange-600/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded font-semibold flex items-center gap-1 animate-pulse">
                      <Navigation className="h-3 w-3" /> Live GPS
                    </span>
                    <span className="text-xs text-zinc-500">Tần số cập nhật: 5s</span>
                  </div>

                  <div className="text-center py-4 z-10">
                    <p className="text-xs text-zinc-500 uppercase">Tọa độ xe hiện tại</p>
                    {delivery.currentLat && delivery.currentLng ? (
                      <p className="text-base font-mono font-black text-zinc-900 dark:text-white mt-1">
                        {delivery.currentLat.toFixed(6)}, {delivery.currentLng.toFixed(6)}
                      </p>
                    ) : (
                      <p className="text-xs text-zinc-500 italic mt-1">Đang kết nối tín hiệu xe...</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-zinc-650 dark:text-zinc-400 z-10 border-t border-zinc-200 dark:border-zinc-900 pt-2">
                    <MapPin className="h-4 w-4 text-orange-500 shrink-0" />
                    <span className="truncate">Xe cẩu đang đi tới khu vực công trình</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Purchased Items Table */}
          <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/10 p-6 space-y-4 shadow-sm shadow-zinc-100/50 dark:shadow-none">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Danh sách vật tư đặt hàng</h3>
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {order.items && order.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-4 text-sm">
                  <div className="min-w-0 flex-grow pr-4">
                    <p className="font-semibold text-zinc-850 dark:text-white truncate">{item.productName}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">
                      Đơn giá: {item.unitPrice.toLocaleString('vi-VN')}đ / {item.unit}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-zinc-550 dark:text-zinc-400">SL: {item.quantity} {item.unit}</p>
                    <p className="font-bold text-zinc-900 dark:text-white mt-0.5">
                      {(item.subtotal).toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right pane: Details Card */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/10 p-6 space-y-6 shadow-sm shadow-zinc-100/50 dark:shadow-none">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-3">Chi tiết đơn hàng</h3>
            
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-zinc-500 block text-xs uppercase font-semibold">Tên khách hàng</span>
                <span className="font-bold text-zinc-900 dark:text-white">{order.customerName}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-xs uppercase font-semibold">Số điện thoại liên hệ</span>
                <span className="font-bold text-zinc-900 dark:text-white">{order.customerPhone}</span>
              </div>
              <div>
                <span className="text-zinc-500 block text-xs uppercase font-semibold">Địa chỉ giao hàng</span>
                <span className="font-bold text-zinc-900 dark:text-white">{order.deliveryAddress}</span>
              </div>
              {order.notes && (
                <div>
                  <span className="text-zinc-500 block text-xs uppercase font-semibold">Ghi chú công trình</span>
                  <span className="text-zinc-500 italic">"{order.notes}"</span>
                </div>
              )}
              <div>
                <span className="text-zinc-500 block text-xs uppercase font-semibold">Ngày tạo đơn</span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {new Date(order.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 flex justify-between items-baseline">
              <span className="text-base font-bold text-zinc-900 dark:text-white">Tổng số tiền:</span>
              <span className="text-xl font-black text-orange-500">
                {(order.totalAmount).toLocaleString('vi-VN')}đ
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
