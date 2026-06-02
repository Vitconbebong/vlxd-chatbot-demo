import React, { useEffect, useState } from 'react';
import { getInventory, receiveStock, getLowStockInventory, getWarehouses } from '../api/wms';
import { getProducts, getCategories } from '../api/catalog';
import { Warehouse, Plus, AlertTriangle, RefreshCw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import toast from 'react-hot-toast';

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [filterWarehouse, setFilterWarehouse] = useState('all');

  // Receive form state
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [binLocation, setBinLocation] = useState('');
  const [refNumber, setRefNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Auto-create product form state
  const [autoCreate, setAutoCreate] = useState(false);
  const [productName, setProductName] = useState('');
  const [productSku, setProductSku] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState('Cái');
  const [basePrice, setBasePrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [specs, setSpecs] = useState([{ key: '', value: '' }]);
  const [categories, setCategories] = useState([]);

  const addSpec = () => setSpecs([...specs, { key: '', value: '' }]);
  const removeSpec = (index) => setSpecs(specs.filter((_, i) => i !== index));
  const handleSpecChange = (index, field, value) => {
    const newSpecs = [...specs];
    newSpecs[index][field] = value;
    setSpecs(newSpecs);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const invData = await getInventory(filterWarehouse === 'all' ? '' : filterWarehouse);
      setInventory(invData);

      // Load warehouses dynamically instead of extracting from inventory items
      const whData = await getWarehouses();
      setWarehouses(whData);

      // Load products for dropdown selection in "Nhập kho"
      const prodData = await getProducts({ page: 1, pageSize: 1000 });
      setProducts(prodData.items || []);

      // Load categories for auto-create products dropdown
      const catTree = await getCategories();
      const flattenForSelect = (list, depth = 0) => {
        let result = [];
        list.forEach(item => {
          result.push({ id: item.id, name: item.name, depth });
          if (item.children && item.children.length > 0) {
            result.push(...flattenForSelect(item.children, depth + 1));
          }
        });
        return result;
      };
      setCategories(flattenForSelect(catTree));
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải thông tin kho bãi hoặc danh mục.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterWarehouse]);

  const handleReceiveStockSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWarehouseId || !quantity) {
      toast.error('Vui lòng chọn kho và điền số lượng.');
      return;
    }

    if (autoCreate) {
      if (!productName.trim() || !productSku.trim() || !unitOfMeasure.trim() || !basePrice || !categoryId) {
        toast.error('Vui lòng điền đầy đủ thông tin bắt buộc cho sản phẩm mới.');
        return;
      }
      const priceVal = parseFloat(basePrice);
      if (isNaN(priceVal) || priceVal <= 0) {
        toast.error('Đơn giá bán lẻ phải lớn hơn 0.');
        return;
      }
    } else {
      if (!selectedProductId) {
        toast.error('Vui lòng chọn vật tư.');
        return;
      }
    }

    const qtyVal = parseFloat(quantity);
    if (isNaN(qtyVal) || qtyVal <= 0) {
      toast.error('Số lượng nhập kho phải lớn hơn 0.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        warehouseId: selectedWarehouseId,
        productId: autoCreate ? null : selectedProductId,
        productName: autoCreate ? productName : undefined,
        productSku: autoCreate ? productSku : undefined,
        unitOfMeasure: autoCreate ? unitOfMeasure : undefined,
        basePrice: autoCreate ? parseFloat(basePrice) : undefined,
        categoryId: autoCreate ? categoryId : undefined,
        quantity: qtyVal,
        binLocation,
        referenceNumber: refNumber || undefined,
        notes: notes || undefined,
        specifications: autoCreate ? specs.filter(s => s.key.trim() !== '') : undefined
      };

      await receiveStock(payload);
      toast.success('Đã nhập kho thành công!');
      setReceiveModalOpen(false);
      
      // Reset form
      setQuantity('');
      setBinLocation('');
      setRefNumber('');
      setNotes('');
      setProductName('');
      setProductSku('');
      setUnitOfMeasure('Cái');
      setBasePrice('');
      setCategoryId('');
      setSpecs([{ key: '', value: '' }]);
      setAutoCreate(false);
      
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi nhập kho.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Quản lý Kho hàng</h1>
          <p className="text-xs text-zinc-500 mt-1">Kiểm kê lượng tồn kho khả dụng và làm thủ tục nhập kho vật tư</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs h-8 px-3 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
            onClick={() => setReceiveModalOpen(true)}
          >
            <Plus className="h-4 w-4" /> Làm thủ tục Nhập kho
          </Button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex items-center gap-4 bg-white dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm shadow-zinc-100/50 dark:shadow-none">
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <Warehouse className="h-4 w-4 text-orange-500" />
          <span className="font-semibold">Bộ lọc kho:</span>
        </div>
        <select 
          className="bg-zinc-55 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 rounded-lg text-xs font-semibold text-zinc-900 dark:text-white px-3 py-1.5 focus:outline-none focus:border-orange-500 transition-colors"
          value={filterWarehouse}
          onChange={(e) => setFilterWarehouse(e.target.value)}
        >
          <option value="all">Tất cả kho hàng</option>
          {warehouses.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>

      {/* Inventory Table */}
      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/10 p-12 text-center animate-pulse">
          Đang tải dữ liệu kiểm kê tồn kho...
        </div>
      ) : inventory.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-12 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/10">
          Không tìm thấy thông tin tồn kho phù hợp.
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/20 overflow-hidden shadow-sm shadow-zinc-100/50 dark:shadow-none">
          <Table>
            <TableHeader className="bg-zinc-100 dark:bg-zinc-900/50">
              <TableRow className="border-zinc-200 dark:border-zinc-850">
                <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold">Vật Tư</TableHead>
                <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold">Kho Bãi</TableHead>
                <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold text-center">Thực Tế (On Hand)</TableHead>
                <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold text-center">Giữ Cho Đơn (Reserved)</TableHead>
                <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold text-center">Khả Dụng (Available)</TableHead>
                <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold">Vị Trí Kệ</TableHead>
                <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold">Cảnh Báo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.map((item) => {
                const isLowStock = item.quantityAvailable < 10;
                return (
                  <TableRow 
                    key={item.id} 
                    className={`border-zinc-200 dark:border-zinc-850 transition-colors ${
                      isLowStock 
                        ? 'bg-red-500/5 hover:bg-red-500/10 text-red-700 dark:text-red-200' 
                        : 'hover:bg-zinc-100/50 text-zinc-700 dark:hover:bg-zinc-900/40 dark:text-zinc-300'
                    }`}
                  >
                    <TableCell className="font-semibold text-zinc-900 dark:text-white">{item.productName}</TableCell>
                    <TableCell className="font-medium">{item.warehouseName}</TableCell>
                    <TableCell className="text-center font-mono font-semibold">{item.quantityOnHand}</TableCell>
                    <TableCell className="text-center font-mono text-zinc-400 dark:text-zinc-500">{item.quantityReserved}</TableCell>
                    <TableCell className="text-center font-mono font-bold">
                      {item.quantityAvailable}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{item.binLocation || 'N/A'}</TableCell>
                    <TableCell>
                      {isLowStock ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-red-600 dark:text-red-400 font-bold bg-red-400/10 border border-red-500/25 px-2 py-0.5 rounded uppercase">
                          <AlertTriangle className="h-3 w-3" /> Hết hàng sắp tới
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-400/10 border border-emerald-500/25 px-2 py-0.5 rounded uppercase">
                          Bình thường
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Nhập kho Modal */}
      <Dialog open={receiveModalOpen} onOpenChange={setReceiveModalOpen}>
        <DialogContent className="bg-white border-zinc-200 text-zinc-800 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white max-w-md transition-all duration-300">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white">Lập Biên Bản Nhập Kho</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleReceiveStockSubmit} className="space-y-4 pt-4 text-sm">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Chọn kho nhận *</label>
              <select 
                className="w-full bg-zinc-55 border border-zinc-300 rounded-lg text-xs text-zinc-900 px-3 py-2.5 focus:outline-none focus:border-orange-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white transition-colors"
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                required
              >
                <option value="">-- Chọn kho hàng --</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id="autoCreateToggle"
                checked={autoCreate}
                onChange={(e) => {
                  setAutoCreate(e.target.checked);
                  if (e.target.checked) {
                    setSelectedProductId('');
                    setProductSku(`VLXD-NEW-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`);
                  }
                }}
                className="rounded border-zinc-300 dark:border-zinc-850 bg-zinc-50 dark:bg-zinc-950 text-orange-500 focus:ring-orange-500 h-4 w-4"
              />
              <label htmlFor="autoCreateToggle" className="text-xs font-semibold text-orange-600 dark:text-orange-550 cursor-pointer select-none">
                Sản phẩm mới (Tự động tạo)
              </label>
            </div>

            {autoCreate ? (
              <div className="space-y-3 p-3 rounded-lg border border-orange-500/20 bg-orange-500/5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Tên sản phẩm *</label>
                    <Input
                      type="text"
                      placeholder="Cát xây thô"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      required
                      className="bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-950 dark:border-zinc-850 dark:text-white dark:placeholder-zinc-650 rounded-lg text-xs h-9 transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Mã sản phẩm (SKU) *</label>
                    <Input
                      type="text"
                      placeholder="VLXD-SKU"
                      value={productSku}
                      onChange={(e) => setProductSku(e.target.value)}
                      required
                      className="bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-950 dark:border-zinc-850 dark:text-white dark:placeholder-zinc-650 rounded-lg text-xs h-9 font-mono transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Đơn vị tính *</label>
                    <Input
                      type="text"
                      placeholder="Bao / Khối(m³) / Viên"
                      value={unitOfMeasure}
                      onChange={(e) => setUnitOfMeasure(e.target.value)}
                      required
                      className="bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-950 dark:border-zinc-850 dark:text-white dark:placeholder-zinc-650 rounded-lg text-xs h-9 transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Đơn giá bán lẻ (VNĐ) *</label>
                    <Input
                      type="number"
                      placeholder="150000"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      required
                      className="bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-950 dark:border-zinc-850 dark:text-white dark:placeholder-zinc-650 rounded-lg text-xs h-9 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Danh mục phân loại *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    required
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-lg text-xs text-zinc-900 px-2.5 py-2.5 focus:outline-none focus:border-orange-500 dark:bg-zinc-950 dark:border-zinc-850 dark:text-white transition-colors"
                  >
                    <option value="">-- Chọn phân loại danh mục --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {catPrefix(c.depth)} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-semibold text-zinc-555 dark:text-zinc-400 uppercase tracking-wider">Thông số kỹ thuật</label>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={addSpec}
                      className="h-5 px-1.5 text-[10px] text-orange-500 hover:bg-orange-500/10"
                    >
                      + Thêm thông số
                    </Button>
                  </div>
                  
                  {specs.map((spec, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <Input
                        type="text"
                        placeholder="Vật liệu / Xuất xứ"
                        value={spec.key}
                        onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                        className="bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-950 dark:border-zinc-850 dark:text-white dark:placeholder-zinc-650 rounded-lg text-xs h-8 w-1/2 transition-colors"
                      />
                      <Input
                        type="text"
                        placeholder="Thép cuộn / Việt Nam"
                        value={spec.value}
                        onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                        className="bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-950 dark:border-zinc-850 dark:text-white dark:placeholder-zinc-650 rounded-lg text-xs h-8 w-1/2 transition-colors"
                      />
                      {specs.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeSpec(idx)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10 shrink-0 text-xs flex items-center justify-center font-bold"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Chọn vật tư nhập *</label>
                <select 
                  className="w-full bg-zinc-55 border border-zinc-300 rounded-lg text-xs text-zinc-900 px-3 py-2.5 focus:outline-none focus:border-orange-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white transition-colors"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  required
                >
                  <option value="">-- Chọn vật tư --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Số lượng nhập *</label>
                <Input
                  type="number"
                  step="0.0001"
                  placeholder="50"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  className="bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-650 rounded-lg text-xs h-10 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Vị trí xếp kệ</label>
                <Input
                  type="text"
                  placeholder="BIN-01"
                  value={binLocation}
                  onChange={(e) => setBinLocation(e.target.value)}
                  className="bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-650 rounded-lg text-xs h-10 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Mã chứng từ liên quan (Ref#)</label>
              <Input
                type="text"
                placeholder="PNK-2026-0001"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                className="bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-650 rounded-lg text-xs h-10 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Ghi chú biên bản</label>
              <Textarea
                placeholder="Lý do nhập kho, người giao hàng, chất lượng sản phẩm..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-650 rounded-lg text-xs transition-colors"
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Button 
                type="button" 
                variant="outline" 
                className="border border-zinc-200 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-800 dark:border-zinc-800 dark:hover:bg-zinc-955 dark:text-zinc-400 dark:hover:text-white transition-colors"
                onClick={() => setReceiveModalOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors"
              >
                {submitting ? 'Đang thực hiện...' : 'Nhập kho'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function catPrefix(depth) {
  if (depth === 0) return '';
  return '─'.repeat(depth) + ' ';
}
