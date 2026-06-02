import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDeliveryById, getVehicles, assignVehicle, updateDeliveryStatus } from '../api/wms';
import { 
  ArrowLeft, 
  Truck, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Navigation, 
  FileText,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import toast from 'react-hot-toast';

export default function DeliveryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [delivery, setDelivery] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Assign Vehicle Modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Failure Incident Modal
  const [failModalOpen, setFailModalOpen] = useState(false);
  const [failureReason, setFailureReason] = useState('');
  const [failing, setFailing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getDeliveryById(id);
      setDelivery(data);
      
      const allVehicles = await getVehicles();
      setVehicles(allVehicles);
    } catch (err) {
      console.error(err);
      toast.error('Không thể lấy chi tiết đơn giao hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleAssignVehicle = async (e) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      toast.error('Vui lòng chọn một phương tiện.');
      return;
    }

    setAssigning(true);
    try {
      await assignVehicle(id, selectedVehicleId);
      toast.success('Đã điều xe cẩu thành công!');
      setAssignModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi gán phương tiện.');
    } finally {
      setAssigning(false);
    }
  };

  const handleStartTransit = async () => {
    try {
      await updateDeliveryStatus(id, 'InTransit');
      toast.success('Đã xuất kho giao hàng! Bắt đầu hành trình.');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi xuất kho.');
    }
  };

  const handleCompleteDelivery = async () => {
    try {
      await updateDeliveryStatus(id, 'Delivered');
      toast.success('Xác nhận giao hàng hoàn thành thành công!');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật.');
    }
  };

  const handleFailDeliverySubmit = async (e) => {
    e.preventDefault();
    if (!failureReason.trim()) {
      toast.error('Vui lòng nhập lý do sự cố.');
      return;
    }

    setFailing(true);
    try {
      await updateDeliveryStatus(id, 'Failed', failureReason);
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

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
      case 'dispatched': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'intransit': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'delivered': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'failed': return 'bg-red-500/10 text-red-650 dark:text-red-400 border-red-500/20';
      default: return 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-850 dark:text-zinc-400 dark:border-zinc-800';
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'Chờ điều phối xe';
      case 'dispatched': return 'Đã gán phương tiện';
      case 'intransit': return 'Đang đi giao hàng';
      case 'delivered': return 'Giao hàng thành công';
      case 'failed': return 'Giao hàng thất bại';
      default: return status || 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
        <p className="text-zinc-500 text-sm">Đang tải dữ liệu hành trình giao vận...</p>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="text-center py-16 space-y-4">
        <ShieldAlert className="h-12 w-12 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Không tìm thấy thông tin đơn giao hàng</h3>
        <Button onClick={() => navigate('/deliveries')} className="bg-zinc-100 border border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-850 dark:border-zinc-800 dark:hover:bg-zinc-800">
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header View */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <button 
            onClick={() => navigate('/deliveries')} 
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Quay lại danh sách điều phối</span>
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-zinc-900 dark:text-white">Chi Tiết Giao Vận</h1>
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold border uppercase tracking-wider ${getStatusBadge(delivery.status)}`}>
              {getStatusLabel(delivery.status)}
            </span>
          </div>
          <p className="text-xs text-zinc-500">Mã vận đơn: <span className="font-mono text-zinc-600 dark:text-zinc-400">#{delivery.id}</span></p>
        </div>

        {/* Action Controls based on Status */}
        <div className="flex gap-2 w-full md:w-auto">
          {delivery.status.toLowerCase() === 'pending' && (
            <Button 
              className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-5 py-5 rounded-xl shadow-lg shadow-orange-600/20 w-full md:w-auto"
              onClick={() => setAssignModalOpen(true)}
            >
              <Truck className="h-4 w-4 mr-2" /> Điều Phối Xe Cẩu
            </Button>
          )}
          {delivery.status.toLowerCase() === 'dispatched' && (
            <Button 
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-5 rounded-xl shadow-lg shadow-blue-600/20 w-full md:w-auto"
              onClick={handleStartTransit}
            >
              <Navigation className="h-4 w-4 mr-2 animate-pulse" /> Xuất Kho Giao Hàng
            </Button>
          )}
          {delivery.status.toLowerCase() === 'intransit' && (
            <div className="flex gap-2 w-full">
              <Button 
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-5 rounded-xl shadow-lg shadow-emerald-600/20 flex-grow md:flex-grow-0"
                onClick={handleCompleteDelivery}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" /> Hoàn Thành Đơn
              </Button>
              <Button 
                variant="destructive"
                className="font-bold text-xs px-4 py-5 rounded-xl flex-grow md:flex-grow-0"
                onClick={() => setFailModalOpen(true)}
              >
                <XCircle className="h-4 w-4 mr-2" /> Báo Cáo Sự Cố
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Order details & Progress */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Progress Timeline */}
          <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/10 p-6 space-y-6 shadow-sm shadow-zinc-100/50 dark:shadow-none">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-zinc-500 dark:text-zinc-400">Trạng Thái Hành Trình</h3>
            
            <div className="relative pl-8 space-y-6">
              {/* Timeline connector line */}
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-zinc-200 dark:bg-zinc-800"></div>

              {/* Step 1: Created */}
              <div className="relative">
                <div className="absolute left-[-27px] top-0.5 rounded-full bg-emerald-500/10 border border-emerald-500 p-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white">Khởi tạo vận đơn</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Vận đơn tự động tạo từ hệ thống bán lẻ VLXD</p>
                </div>
              </div>

              {/* Step 2: Dispatched */}
              <div className="relative">
                <div className={`absolute left-[-27px] top-0.5 rounded-full p-1 border ${
                  ['dispatched', 'intransit', 'delivered'].includes(delivery.status.toLowerCase())
                    ? 'bg-emerald-500/10 border-emerald-500'
                    : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800'
                }`}>
                  <CheckCircle2 className={`h-3 w-3 ${
                    ['dispatched', 'intransit', 'delivered'].includes(delivery.status.toLowerCase())
                      ? 'text-emerald-500 dark:text-emerald-400'
                      : 'text-zinc-300 dark:text-zinc-700'
                  }`} />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${['dispatched', 'intransit', 'delivered'].includes(delivery.status.toLowerCase()) ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500'}`}>
                    Điều phối xe cẩu
                  </h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {delivery.vehicleId 
                      ? `Đã phân công xe ${delivery.plateNumber} (Tài xế: ${delivery.driverName})` 
                      : 'Chờ phân phối xe tải cẩu và lịch hẹn giao'}
                  </p>
                </div>
              </div>

              {/* Step 3: InTransit */}
              <div className="relative">
                <div className={`absolute left-[-27px] top-0.5 rounded-full p-1 border ${
                  ['intransit', 'delivered'].includes(delivery.status.toLowerCase())
                    ? 'bg-emerald-500/10 border-emerald-500'
                    : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800'
                }`}>
                  <Navigation className={`h-3 w-3 ${
                    ['intransit', 'delivered'].includes(delivery.status.toLowerCase())
                      ? 'text-emerald-500 dark:text-emerald-400'
                      : 'text-zinc-300 dark:text-zinc-700'
                  }`} />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${['intransit', 'delivered'].includes(delivery.status.toLowerCase()) ? 'text-zinc-900 dark:text-white' : 'text-zinc-400 dark:text-zinc-500'}`}>
                    Bắt đầu giao vận
                  </h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {delivery.status.toLowerCase() === 'intransit' 
                      ? 'Phương tiện đang di chuyển thực tế. GPS được kích hoạt.'
                      : delivery.actualArrival || delivery.status.toLowerCase() === 'delivered'
                        ? 'Đã xuất kho và di chuyển đến công trường'
                        : 'Phương tiện đang chuẩn bị bốc xếp hàng hóa tại kho'}
                  </p>
                </div>
              </div>

              {/* Step 4: Finished/Failed */}
              <div className="relative">
                <div className={`absolute left-[-27px] top-0.5 rounded-full p-1 border ${
                  delivery.status.toLowerCase() === 'delivered'
                    ? 'bg-emerald-500/10 border-emerald-500'
                    : delivery.status.toLowerCase() === 'failed'
                      ? 'bg-red-500/10 border-red-500'
                      : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
                }`}>
                  {delivery.status.toLowerCase() === 'failed' ? (
                    <XCircle className="h-3 w-3 text-red-500 dark:text-red-400" />
                  ) : (
                    <CheckCircle2 className={`h-3 w-3 ${
                      delivery.status.toLowerCase() === 'delivered' ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-300 dark:text-zinc-700'
                    }`} />
                  )}
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${
                    delivery.status.toLowerCase() === 'delivered'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : delivery.status.toLowerCase() === 'failed'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-zinc-400 dark:text-zinc-500'
                  }`}>
                    {delivery.status.toLowerCase() === 'failed' ? 'Gặp sự cố vận chuyển' : 'Giao nhận hoàn tất'}
                  </h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    {delivery.status.toLowerCase() === 'delivered'
                      ? `Hoàn thành bàn giao lúc: ${new Date(delivery.actualArrival).toLocaleString('vi-VN')}`
                      : delivery.status.toLowerCase() === 'failed'
                        ? `Lý do sự cố: ${delivery.notes || 'Không rõ nguyên nhân'}`
                        : 'Chờ xác nhận giao nhận thực tế từ khách hàng tại công trình'}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Map Simulation - Premium Aesthetics */}
          <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/10 p-6 space-y-4 shadow-sm shadow-zinc-100/50 dark:shadow-none">
            <div className="flex justify-between items-center">
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-zinc-500 dark:text-zinc-400">Định Vị Vệ Tinh (GPS) & Hành Trình Thực Tế</h3>
              {delivery.status.toLowerCase() === 'intransit' && (
                <span className="flex items-center gap-1 text-[10px] text-orange-500 font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-ping"></span>
                  <span>Real-time GPS Active</span>
                </span>
              )}
            </div>
            
            {/* Dark Styled Map Mock using SVG */}
            <div className="relative h-72 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 overflow-hidden flex items-center justify-center">
              <svg className="absolute inset-0 h-full w-full opacity-35" xmlns="http://www.w3.org/2000/svg">
                {/* Gridlines */}
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                {/* Mock Roads */}
                <path d="M-10,120 Q120,80 250,150 T600,100" fill="none" stroke="currentColor" className="text-zinc-100 dark:text-zinc-900" strokeWidth="14" />
                <path d="M-10,120 Q120,80 250,150 T600,100" fill="none" stroke="currentColor" className="text-zinc-400 dark:text-zinc-100" strokeWidth="2" strokeDasharray="5,5" className="opacity-10" />
                
                <path d="M120,-10 L150,140 L280,300" fill="none" stroke="currentColor" className="text-zinc-100 dark:text-zinc-900" strokeWidth="12" />
              </svg>

              {/* Map Info overlays */}
              <div className="absolute top-4 left-4 bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 backdrop-blur-md px-3 py-2 rounded-lg space-y-1 text-[10px]">
                <p className="text-zinc-500 dark:text-zinc-400 font-medium">Kho Xuất Phát: <span className="text-zinc-900 dark:text-white font-bold">Tổng Kho VLXD Thủ Đức</span></p>
                <p className="text-zinc-550 dark:text-zinc-400 font-medium">Điểm Đến: <span className="text-orange-600 dark:text-orange-400 font-bold max-w-[150px] truncate block">{delivery.deliveryAddress}</span></p>
              </div>

              {/* Pins */}
              {/* Warehouse Pin */}
              <div className="absolute left-[110px] top-[30px] flex flex-col items-center">
                <div className="h-5 w-5 rounded-full bg-zinc-200 dark:bg-zinc-800 border-2 border-zinc-900 dark:border-white flex items-center justify-center shadow-lg">
                  <WarehousePinIcon className="h-3 w-3 text-zinc-900 dark:text-white" />
                </div>
                <span className="text-[8px] font-mono text-zinc-500 mt-0.5">KHO CHỨA</span>
              </div>

              {/* Destination Pin */}
              <div className="absolute left-[290px] top-[170px] flex flex-col items-center">
                <div className="h-6 w-6 rounded-full bg-orange-500/10 border-2 border-orange-500 flex items-center justify-center shadow-lg shadow-orange-600/30 animate-bounce">
                  <MapPin className="h-3.5 w-3.5 text-orange-500" />
                </div>
                <span className="text-[9px] font-bold text-orange-600 dark:text-orange-400 mt-1">CÔNG TRÌNH</span>
              </div>

              {/* Vehicle Moving Marker */}
              {delivery.vehicleId && delivery.status.toLowerCase() === 'intransit' && (
                <div className="absolute left-[190px] top-[95px] flex flex-col items-center animate-pulse">
                  <div className="h-8 w-8 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 border border-blue-400">
                    <Truck className="h-4.5 w-4.5 text-white" />
                  </div>
                  <span className="text-[8px] font-bold bg-blue-500 text-white px-1 py-0.2 rounded mt-1 font-mono">{delivery.plateNumber}</span>
                </div>
              )}

              {/* Placeholder text if not assigned/pending */}
              {!delivery.vehicleId && (
                <div className="absolute inset-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 space-y-2">
                  <Navigation className="h-8 w-8 text-zinc-400 dark:text-zinc-600 animate-pulse" />
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">Chờ phân công phương tiện để lập bản đồ định vị hành trình</p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-650">Định vị GPS thực tế sẽ được đồng bộ khi tài xế nhấn xuất kho.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Order summary & vehicle assignment */}
        <div className="space-y-6">
          
          {/* Order Details Info Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/10 p-6 space-y-4 shadow-sm shadow-zinc-100/50 dark:shadow-none">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-zinc-550 dark:text-zinc-400 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
              Thông Tin Vận Đơn
            </h3>
            
            <div className="space-y-3.5 text-xs">
              <div className="pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <span className="text-zinc-500 dark:text-zinc-400 block text-[10px] uppercase font-semibold">Mã Đơn Bán Lẻ</span>
                <span className="font-mono text-zinc-900 dark:text-white font-bold">#{delivery.orderId.substring(0, 8)}...</span>
              </div>
              
              <div className="pb-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                <div>
                  <span className="text-zinc-500 dark:text-zinc-400 block text-[10px] uppercase font-semibold">Ngày giao dự kiến</span>
                  <span className="text-zinc-700 dark:text-zinc-300 font-semibold">
                    {delivery.estimatedArrival ? new Date(delivery.estimatedArrival).toLocaleDateString('vi-VN') : 'Trong ngày'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-zinc-500 dark:text-zinc-400 block text-[10px] uppercase font-semibold">Giờ dự kiến</span>
                  <span className="text-orange-600 dark:text-orange-400 font-bold flex items-center gap-1 justify-end font-mono">
                    <Clock className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                    {delivery.estimatedArrival ? new Date(delivery.estimatedArrival).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-zinc-500 dark:text-zinc-400 block text-[10px] uppercase font-semibold mb-1">Địa chỉ giao nhận thực tế</span>
                <span className="text-zinc-900 dark:text-white font-medium flex items-start gap-1.5">
                  <MapPin className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                  <span>{delivery.deliveryAddress}</span>
                </span>
              </div>

              {delivery.notes && (
                <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <span className="text-zinc-500 dark:text-zinc-555 block text-[10px] uppercase font-bold">Ghi chú điều vận</span>
                  <p className="text-zinc-600 dark:text-zinc-400 italic mt-0.5 font-medium">"{delivery.notes}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle and Driver card */}
          <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/10 p-6 space-y-4 shadow-sm shadow-zinc-100/50 dark:shadow-none">
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
              Phương Tiện & Tài Xế
            </h3>

            {delivery.vehicleId ? (
              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Biển số xe cẩu</span>
                    <p className="font-mono text-sm font-black text-zinc-900 dark:text-white">{delivery.plateNumber}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-500 border border-orange-500/20 flex items-center justify-center">
                    <Truck className="h-5 w-5" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <User className="h-4 w-4 text-zinc-550 dark:text-zinc-400" />
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Tên tài xế</span>
                      <p className="font-bold text-zinc-900 dark:text-white text-xs">{delivery.driverName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-zinc-550 dark:text-zinc-400" />
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Số điện thoại liên lạc</span>
                      <p className="font-mono font-bold text-orange-600 dark:text-orange-400 text-xs">{delivery.driverPhone}</p>
                    </div>
                  </div>
                </div>

                {delivery.status.toLowerCase() === 'pending' || delivery.status.toLowerCase() === 'dispatched' ? (
                  <Button 
                    variant="outline" 
                    className="w-full text-xs font-bold border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-xl mt-2 h-10"
                    onClick={() => setAssignModalOpen(true)}
                  >
                    Thay Đổi Xe Giao Hàng
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="text-center py-6 space-y-3">
                <p className="text-zinc-400 dark:text-zinc-500 text-xs italic">Chưa chỉ định phương tiện giao vận.</p>
                <Button 
                  className="bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-orange-600/10"
                  onClick={() => setAssignModalOpen(true)}
                >
                  Gán Xe & Tài Xế
                </Button>
              </div>
            )}
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
              <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Chọn xe cẩu có sẵn</label>
              <select 
                className="w-full bg-zinc-50 border border-zinc-300 rounded-lg text-xs text-zinc-900 px-3 py-2.5 focus:outline-none focus:border-orange-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white"
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                required
              >
                <option value="" className="bg-white dark:bg-zinc-955 text-zinc-900 dark:text-white">-- Chọn xe tải --</option>
                {vehicles
                  .filter(v => v.currentStatus.toLowerCase() === 'available' || v.id === delivery.vehicleId)
                  .map(v => (
                    <option key={v.id} value={v.id} className="bg-white dark:bg-zinc-955 text-zinc-900 dark:text-white">
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
                {assigning ? 'Đang cập nhật...' : 'Xác nhận điều phối'}
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
              <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Mô tả chi tiết sự cố</label>
              <textarea 
                placeholder="Ví dụ: Công trình kẹt đường xe lớn không vào được, khách hàng xin dời ngày nhận hàng, v.v."
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

// Simple Helper Warehouse Pin Icon
function WarehousePinIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 21h18" />
      <path d="M3 7v1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1" />
      <path d="M19 21V10.85" />
      <path d="M5 21V10.85" />
      <path d="M5 10V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3" />
    </svg>
  );
}
