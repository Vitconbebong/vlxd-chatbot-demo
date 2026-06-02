import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDeliveries, getVehicles, assignVehicle, updateDeliveryStatus } from '../api/wms';
import { Truck, User, Navigation, CheckCircle, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import toast from 'react-hot-toast';
import { Skeleton } from '../components/ui/skeleton';

export default function DeliveriesPage() {
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Vehicle assignment state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Failure modal state
  const [failModalOpen, setFailModalOpen] = useState(false);
  const [failDeliveryId, setFailDeliveryId] = useState(null);
  const [failureReason, setFailureReason] = useState('');
  const [failing, setFailing] = useState(false);

  const loadData = async () => {
    try {
      const [delData, vehData] = await Promise.all([
        getDeliveries(),
        getVehicles()
      ]);
      setDeliveries(delData);
      setVehicles(vehData);
    } catch (err) {
      console.error(err);
      toast.error('Không thể lấy thông tin giao nhận vận tải.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssignVehicle = async (e) => {
    e.preventDefault();
    if (!selectedVehicleId || !selectedDeliveryId) {
      toast.error('Vui lòng chọn một phương tiện.');
      return;
    }

    setAssigning(true);
    try {
      await assignVehicle(selectedDeliveryId, selectedVehicleId);
      toast.success('Đã điều xe thành công!');
      setAssignModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi gán phương tiện.');
    } finally {
      setAssigning(false);
    }
  };

  const handleStartTransit = async (id) => {
    try {
      await updateDeliveryStatus(id, 'InTransit');
      toast.success('Đã xuất kho giao hàng!');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật.');
    }
  };

  const handleCompleteDelivery = async (id) => {
    try {
      await updateDeliveryStatus(id, 'Delivered');
      toast.success('Giao hàng hoàn thành thành công!');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật.');
    }
  };

  const handleFailDeliverySubmit = async (e) => {
    e.preventDefault();
    if (!failureReason.trim()) {
      toast.error('Vui lòng nhập lý do thất bại.');
      return;
    }

    setFailing(true);
    try {
      await updateDeliveryStatus(failDeliveryId, 'Failed', failureReason);
      toast.success('Đã ghi nhận sự cố giao hàng.');
      setFailModalOpen(false);
      setFailureReason('');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật.');
    } finally {
      setFailing(false);
    }
  };

  const openAssignModal = (deliveryId) => {
    setSelectedDeliveryId(deliveryId);
    setSelectedVehicleId('');
    setAssignModalOpen(true);
  };

  const openFailModal = (deliveryId) => {
    setFailDeliveryId(deliveryId);
    setFailureReason('');
    setFailModalOpen(true);
  };

  const getDeliveryBadge = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
      case 'dispatched': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'intransit': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'delivered': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'failed': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      default: return 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-800';
    }
  };

  const getDeliveryLabel = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'Chờ điều xe';
      case 'dispatched': return 'Đã gán xe';
      case 'intransit': return 'Đang đi giao';
      case 'delivered': return 'Đã giao';
      case 'failed': return 'Thất bại';
      default: return status;
    }
  };

  return (
    <div className="space-y-8">
      {/* Tab Header layout */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Giao Hàng & Đội Xe</h1>
          <p className="text-xs text-zinc-500 mt-1">Điều vận xe cẩu cẩu hàng và theo dõi hành trình giao nhận thực tế</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* Deliveries list (3/4 width) */}
        <div className="xl:col-span-3 space-y-4">
          <h3 className="text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider">Hành trình giao vận</h3>
          
          {loading ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/10 p-12 text-center animate-pulse">
              Đang tải danh sách giao nhận...
            </div>
          ) : deliveries.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-12 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/10">
              Không có hành trình giao vận nào.
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/20 overflow-hidden shadow-sm shadow-zinc-100/50 dark:shadow-none">
              <Table>
                <TableHeader className="bg-zinc-100 dark:bg-zinc-900/50">
                  <TableRow className="border-zinc-200 dark:border-zinc-800">
                    <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold">Mã Đơn</TableHead>
                    <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold">Địa Chỉ Giao</TableHead>
                    <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold">Tài Xế / Xe</TableHead>
                    <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold">Trạng Thái</TableHead>
                    <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold">Thời Gian Dự Kiến</TableHead>
                    <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold text-right">Điều Vận</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.map((d) => (
                    <TableRow key={d.id} className="border-zinc-200 hover:bg-zinc-100/50 dark:border-zinc-800 dark:hover:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300">
                      <TableCell className="font-mono text-zinc-500 dark:text-zinc-400">#{d.orderId.substring(0, 8)}...</TableCell>
                      <TableCell className="max-w-[200px] truncate">{d.deliveryAddress}</TableCell>
                      <TableCell>
                        {d.vehicleId ? (
                          <div className="text-xs">
                            <p className="font-bold text-zinc-900 dark:text-white">{d.driverName}</p>
                            <p className="text-zinc-400 dark:text-zinc-500 font-mono text-[10px]">{d.plateNumber}</p>
                          </div>
                        ) : (
                          <span className="text-zinc-600 text-xs italic">Chưa phân công</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${getDeliveryBadge(d.status)}`}>
                          {getDeliveryLabel(d.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-zinc-500">
                        {d.estimatedArrival ? new Date(d.estimatedArrival).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-900/60 text-[10px] h-8 px-2.5 font-semibold"
                            onClick={() => navigate(`/deliveries/${d.id}`)}
                          >
                            Chi Tiết
                          </Button>
                          {d.status.toLowerCase() === 'pending' && (
                            <Button 
                              size="sm" 
                              className="bg-orange-600 hover:bg-orange-500 text-white text-[10px] h-8 px-3 font-semibold"
                              onClick={() => openAssignModal(d.id)}
                            >
                              Điều Xe
                            </Button>
                          )}
                          {d.status.toLowerCase() === 'dispatched' && (
                            <Button 
                              size="sm" 
                              className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] h-8 px-3 font-semibold"
                              onClick={() => handleStartTransit(d.id)}
                            >
                              Xuất Kho
                            </Button>
                          )}
                          {d.status.toLowerCase() === 'intransit' && (
                            <>
                              <Button 
                                size="sm" 
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] h-8 px-2.5 font-semibold"
                                onClick={() => handleCompleteDelivery(d.id)}
                              >
                                Hoàn Thành
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                className="text-[10px] h-8 px-2.5 font-semibold"
                                onClick={() => openFailModal(d.id)}
                              >
                                Sự Cố
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Vehicles list sidebar (1/4 width) */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-zinc-800 dark:text-white uppercase tracking-wider">Đội xe giao nhận</h3>
          
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full bg-zinc-200 dark:bg-zinc-800 rounded-xl animate-pulse" />
              ))
            ) : vehicles.map((v) => (
              <div 
                key={v.id} 
                className="p-4 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/10 space-y-2 text-xs shadow-sm shadow-zinc-100/50 dark:shadow-none"
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-zinc-900 dark:text-white">{v.plateNumber}</span>
                  <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold border ${
                    v.currentStatus.toLowerCase() === 'available' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : v.currentStatus.toLowerCase() === 'ondelivery'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700'
                  }`}>
                    {v.currentStatus === 'Available' ? 'Sẵn sàng' : v.currentStatus === 'OnDelivery' ? 'Đang giao' : 'Bảo trì'}
                  </span>
                </div>
                <div className="text-zinc-600 dark:text-zinc-400 space-y-1">
                  <p className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                    <span>{v.driverName} • {v.driverPhone}</span>
                  </p>
                  {v.currentStatus === 'OnDelivery' && (
                    <p className="flex items-center gap-1.5 text-[10px] text-orange-400 font-mono">
                      <Navigation className="h-3 w-3 animate-spin" />
                      <span>GPS: {v.currentLat.toFixed(4)}, {v.currentLng.toFixed(4)}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Assign Vehicle Dialog */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="bg-white border-zinc-200 text-zinc-800 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-white">Chỉ định xe cẩu & lái xe</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAssignVehicle} className="space-y-4 pt-4 text-xs">
            <div className="space-y-2">
              <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Chọn phương tiện sẵn sàng</label>
              <select 
                className="w-full bg-zinc-50 border border-zinc-300 rounded-lg text-xs text-zinc-900 px-3 py-2.5 focus:outline-none focus:border-orange-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white"
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                required
              >
                <option value="" className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white">-- Chọn xe tải --</option>
                {vehicles
                  .filter(v => v.currentStatus.toLowerCase() === 'available')
                  .map(v => (
                    <option key={v.id} value={v.id} className="bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white">
                      {v.plateNumber} - {v.driverName}
                    </option>
                  ))
                }
              </select>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Button 
                type="button" 
                variant="ghost" 
                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                onClick={() => setAssignModalOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button 
                type="submit" 
                disabled={assigning}
                className="bg-orange-600 hover:bg-orange-500 text-white font-semibold"
              >
                {assigning ? 'Đang điều phối...' : 'Xác nhận điều phối'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Fail Delivery Dialog */}
      <Dialog open={failModalOpen} onOpenChange={setFailModalOpen}>
        <DialogContent className="bg-white border-zinc-200 text-zinc-800 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-500 flex items-center gap-1.5">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Báo cáo sự cố giao hàng
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleFailDeliverySubmit} className="space-y-4 pt-4 text-xs">
            <div className="space-y-2">
              <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Mô tả sự cố gặp phải</label>
              <textarea 
                placeholder="Ví dụ: Công trình không có đường vào cho xe cẩu lớn, khách hàng hẹn lịch giao ngày khác, công trình chưa sẵn sàng đổ bãi..."
                className="w-full bg-zinc-50 border border-zinc-300 rounded-lg text-xs text-zinc-900 p-3 focus:outline-none focus:border-red-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white"
                value={failureReason}
                onChange={(e) => setFailureReason(e.target.value)}
                rows={4}
                required
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Button 
                type="button" 
                variant="ghost" 
                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                onClick={() => setFailModalOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button 
                type="submit" 
                disabled={failing}
                variant="destructive"
                className="font-semibold"
              >
                {failing ? 'Đang ghi nhận...' : 'Xác nhận sự cố'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
