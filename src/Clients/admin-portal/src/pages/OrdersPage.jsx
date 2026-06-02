import React, { useEffect, useState } from 'react';
import { getOrders, updateOrderStatus } from '../api/sales';
import { Eye, Edit3, ShoppingBag, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import toast from 'react-hot-toast';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const loadOrders = async () => {
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (err) {
      console.error(err);
      toast.error('Không thể lấy danh sách đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success(`Đã cập nhật trạng thái đơn hàng sang: ${newStatus}`);
      loadOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        // Update details model state
        setSelectedOrder(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Không thể cập nhật trạng thái.';
      toast.error(errorMsg);
    }
  };

  const openOrderDetail = (order) => {
    setSelectedOrder(order);
    setDetailModalOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'draft': return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700';
      case 'confirmed': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25';
      case 'delivering': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25';
      case 'completed': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25';
      case 'cancelled': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25';
      default: return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Quản lý Đơn hàng</h1>
        <p className="text-xs text-zinc-500 mt-1">Duyệt thông tin đơn và cập nhật quy trình vận đơn, giao nhận</p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/10 p-12 text-center animate-pulse">
          Đang tải danh sách đơn hàng...
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-12 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/10">
          Chưa phát sinh đơn hàng nào.
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/20 overflow-hidden shadow-sm shadow-zinc-100/50 dark:shadow-none">
          <Table>
            <TableHeader className="bg-zinc-100 dark:bg-zinc-900/50">
              <TableRow className="border-zinc-200 dark:border-zinc-850">
                <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold">Số Đơn</TableHead>
                <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold">Khách Hàng</TableHead>
                <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold">Số Điện Thoại</TableHead>
                <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold">Tổng Thanh Toán</TableHead>
                <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold">Trạng Thái</TableHead>
                <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold">Ngày Đặt</TableHead>
                <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold text-right">Thao Tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id} className="border-zinc-200 hover:bg-zinc-100/50 dark:border-zinc-850 dark:hover:bg-zinc-900/40">
                  <TableCell className="font-mono text-zinc-800 dark:text-zinc-300 font-semibold">{order.orderNumber}</TableCell>
                  <TableCell className="text-zinc-900 dark:text-white font-medium">{order.customerName}</TableCell>
                  <TableCell className="text-zinc-650 dark:text-zinc-450">{order.customerPhone}</TableCell>
                  <TableCell className="text-orange-600 dark:text-orange-400 font-bold">{order.totalAmount.toLocaleString('vi-VN')}đ</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border uppercase ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-zinc-500">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 px-3 text-xs font-semibold rounded-lg border border-zinc-200 text-zinc-750 bg-white hover:text-zinc-955 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:bg-zinc-900/40 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors flex items-center inline-flex gap-1.5"
                      onClick={() => openOrderDetail(order)}
                    >
                      <Eye className="h-4 w-4 text-orange-500" /> Chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Order Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="bg-white border-zinc-200 text-zinc-800 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white flex justify-between items-center pr-6">
              <span>Đơn hàng: {selectedOrder?.orderNumber}</span>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase ${selectedOrder ? getStatusBadge(selectedOrder.status) : ''}`}>
                {selectedOrder?.status}
              </span>
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 pt-4 text-sm">
              {/* Customer summary */}
              <div className="grid grid-cols-2 gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400 block text-xs uppercase font-semibold">Tên người nhận</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">{selectedOrder.customerName}</span>
                </div>
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400 block text-xs uppercase font-semibold">Số điện thoại</span>
                  <span className="font-semibold text-zinc-900 dark:text-white">{selectedOrder.customerPhone}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-zinc-500 dark:text-zinc-400 block text-xs uppercase font-semibold">Địa chỉ giao vật tư</span>
                  <span className="text-zinc-700 dark:text-zinc-300">{selectedOrder.deliveryAddress}</span>
                </div>
                {selectedOrder.notes && (
                  <div className="col-span-2">
                    <span className="text-zinc-500 dark:text-zinc-400 block text-xs uppercase font-semibold">Ghi chú</span>
                    <span className="text-zinc-600 dark:text-zinc-450 italic">"{selectedOrder.notes}"</span>
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-3">
                <span className="text-zinc-500 dark:text-zinc-400 block text-xs uppercase font-semibold">Danh mục vật liệu</span>
                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden text-xs">
                  <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
                    <thead className="bg-zinc-50 dark:bg-zinc-955/40">
                      <tr>
                        <th className="px-4 py-2 text-left text-zinc-500 dark:text-zinc-400">Tên vật tư</th>
                        <th className="px-4 py-2 text-center text-zinc-500 dark:text-zinc-400">Số lượng</th>
                        <th className="px-4 py-2 text-right text-zinc-500 dark:text-zinc-400">Đơn giá</th>
                        <th className="px-4 py-2 text-right text-zinc-500 dark:text-zinc-400">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-850">
                      {selectedOrder.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/20">
                          <td className="px-4 py-2.5 text-zinc-800 dark:text-zinc-200 font-medium">{item.productName}</td>
                          <td className="px-4 py-2.5 text-center text-zinc-700 dark:text-zinc-300">{item.quantity} {item.unit}</td>
                          <td className="px-4 py-2.5 text-right text-zinc-650 dark:text-zinc-400">{item.unitPrice.toLocaleString('vi-VN')}đ</td>
                          <td className="px-4 py-2.5 text-right text-orange-600 dark:text-orange-400 font-bold">{(item.subtotal).toLocaleString('vi-VN')}đ</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-right pt-2">
                  <span className="text-zinc-600 dark:text-zinc-400 mr-2">Tổng số tiền thanh toán:</span>
                  <span className="text-lg font-black text-orange-600 dark:text-orange-500">{(selectedOrder.totalAmount).toLocaleString('vi-VN')}đ</span>
                </div>
              </div>

              {/* Action Buttons to Transition Status */}
              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4 flex flex-wrap gap-2 justify-end">
                {selectedOrder.status.toLowerCase() === 'confirmed' && (
                  <Button 
                    className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
                    onClick={() => handleStatusChange(selectedOrder.id, 'Delivering')}
                  >
                    Bắt đầu giao hàng
                  </Button>
                )}
                {selectedOrder.status.toLowerCase() === 'delivering' && (
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
                    onClick={() => handleStatusChange(selectedOrder.id, 'Completed')}
                  >
                    Xác nhận hoàn thành
                  </Button>
                )}
                {(selectedOrder.status.toLowerCase() === 'draft' || selectedOrder.status.toLowerCase() === 'confirmed') && (
                  <Button 
                    variant="destructive"
                    className="font-semibold text-xs animate-none"
                    onClick={() => handleStatusChange(selectedOrder.id, 'Cancelled')}
                  >
                    Hủy đơn hàng
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
