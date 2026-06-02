import React, { useEffect, useState } from 'react';
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../api/wms';
import { MapPin, Plus, Edit2, Trash2, Calendar, Archive, RefreshCw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import toast from 'react-hot-toast';

export default function WarehouseManagementPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getWarehouses();
      setWarehouses(data);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách kho hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setName('');
    setAddress('');
    setEditMode(false);
    setSelectedWarehouseId(null);
    setModalOpen(true);
  };

  const openEditModal = (wh) => {
    setName(wh.name);
    setAddress(wh.address);
    setEditMode(true);
    setSelectedWarehouseId(wh.id);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      toast.error('Vui lòng điền đầy đủ tên và địa chỉ kho.');
      return;
    }

    setSubmitting(true);
    try {
      if (editMode) {
        await updateWarehouse(selectedWarehouseId, { name, address });
        toast.success('Cập nhật thông tin kho hàng thành công!');
      } else {
        await createWarehouse({ name, address });
        toast.success('Thêm kho hàng mới thành công!');
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Đã xảy ra lỗi khi lưu thông tin.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, whName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa kho hàng "${whName}"?`)) {
      return;
    }

    try {
      await deleteWarehouse(id);
      toast.success('Đã xóa kho hàng thành công.');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Không thể xóa kho hàng này. Vui lòng kiểm tra tồn kho.');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 rounded-2xl border transition-all duration-350 space-y-6 bg-white border-zinc-200 text-zinc-800 shadow-sm shadow-zinc-100/50 dark:bg-zinc-950/40 dark:border-zinc-800/80 dark:text-zinc-100 dark:shadow-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold flex items-center gap-2 text-zinc-900 dark:text-white">
            <MapPin className="h-6 w-6 text-orange-500" />
            Quản Lý Kho Hàng
          </h1>
          <p className="text-xs mt-1 text-zinc-500 dark:text-zinc-400">
            Xem và cấu hình sơ đồ kho bãi vật liệu xây dựng toàn hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Refresh Button */}
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 px-3 text-xs font-semibold rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
            onClick={loadData}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Làm mới
          </Button>

          {/* Add Button */}
          <Button 
            onClick={openCreateModal}
            className="bg-orange-500 text-white hover:bg-orange-600 font-semibold text-xs h-8 px-3 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            Thêm kho mới
          </Button>
        </div>
      </div>

      {/* Content Table */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-sm text-zinc-500 dark:text-zinc-400">
          <RefreshCw className="h-5 w-5 animate-spin text-orange-500 mr-2" />
          <span>Đang tải thông tin kho bãi...</span>
        </div>
      ) : warehouses.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/10 dark:text-zinc-500 p-12 text-center text-sm">
          Không tìm thấy kho hàng nào trong hệ thống.
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-250 bg-zinc-50/30 dark:border-zinc-800 dark:bg-zinc-900/20 overflow-hidden transition-colors">
          <Table>
            <TableHeader className="bg-zinc-100 dark:bg-zinc-900/50">
              <TableRow className="border-zinc-200 dark:border-zinc-850 hover:bg-transparent">
                <TableHead className="text-xs font-bold text-zinc-700 dark:text-zinc-400">Tên Kho Hàng</TableHead>
                <TableHead className="text-xs font-bold text-zinc-700 dark:text-zinc-400">Địa Chỉ Chi Tiết</TableHead>
                <TableHead className="text-xs font-bold text-center text-zinc-700 dark:text-zinc-400">Số Mặt Hàng Tồn</TableHead>
                <TableHead className="text-xs font-bold text-center text-zinc-700 dark:text-zinc-400">Ngày Khởi Tạo</TableHead>
                <TableHead className="text-xs font-bold text-right text-zinc-700 dark:text-zinc-400">Thao Tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {warehouses.map((wh) => (
                <TableRow 
                  key={wh.id} 
                  className="border-b border-zinc-200 hover:bg-zinc-100/50 text-zinc-700 dark:border-zinc-850 dark:hover:bg-zinc-900/40 dark:text-zinc-300 transition-colors"
                >
                  <TableCell className="font-semibold text-zinc-900 dark:text-white">{wh.name}</TableCell>
                  <TableCell className="text-zinc-650 dark:text-zinc-450">{wh.address}</TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-350 dark:border-zinc-700">
                      <Archive className="h-3 w-3 text-orange-500" />
                      {wh.inventoryCount || 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs">{formatDate(wh.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      {/* Uniform Edit Button */}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-3 text-xs font-semibold rounded-lg border border-zinc-200 text-zinc-750 bg-white hover:text-zinc-950 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:bg-zinc-900/40 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                        onClick={() => openEditModal(wh)}
                      >
                        <Edit2 className="h-3 w-3" />
                        Sửa
                      </Button>
                      
                      {/* Uniform Delete Button */}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-3 text-xs font-semibold rounded-lg border border-red-200 bg-red-50 text-red-655 hover:bg-red-100 hover:text-red-800 hover:border-red-300 dark:border-red-950/40 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-900/50 dark:hover:text-red-100 dark:hover:border-red-900/40 transition-colors flex items-center gap-1.5"
                        onClick={() => handleDelete(wh.id, wh.name)}
                      >
                        <Trash2 className="h-3 w-3" />
                        Xóa
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Warehouse Edit / Create Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="border max-w-md bg-white border-zinc-200 text-zinc-800 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white transition-all duration-300">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
              <MapPin className="h-5 w-5 text-orange-500" />
              {editMode ? 'Cập Nhật Kho Hàng' : 'Tạo Kho Hàng Mới'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-sm">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Tên kho hàng *</label>
              <Input
                type="text"
                placeholder="Kho Bình Dương / Kho Thủ Đức"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-lg text-xs h-10 bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-650 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Địa chỉ kho *</label>
              <Input
                type="text"
                placeholder="Số 12, Đường số 5, KCN Sóng Thần..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                className="rounded-lg text-xs h-10 bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-650 transition-colors"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="border border-zinc-200 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-800 dark:border-zinc-800 dark:hover:bg-zinc-950 dark:text-zinc-400 dark:hover:text-white transition-colors"
                onClick={() => setModalOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-sm transition-colors"
              >
                {submitting ? 'Đang xử lý...' : editMode ? 'Lưu thay đổi' : 'Tạo kho mới'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
