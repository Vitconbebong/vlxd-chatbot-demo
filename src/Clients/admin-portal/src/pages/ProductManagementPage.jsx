import React, { useEffect, useState } from 'react';
import { getProducts, createProduct, updateProduct, deleteProduct, getCategories } from '../api/catalog';
import { Plus, Edit, Trash2, SlidersHorizontal, RefreshCw, Hammer } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import toast from 'react-hot-toast';

export default function ProductManagementPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal forms state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Form inputs
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState('');
  const [unitsPerPackage, setUnitsPerPackage] = useState('');
  const [coveragePerPackage, setCoveragePerPackage] = useState('');
  const [wastageRate, setWastageRate] = useState('0.05');
  const [imageUrl, setImageUrl] = useState('');
  const [aliasesText, setAliasesText] = useState(''); // Comma separated aliases
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodData, catData] = await Promise.all([
        getProducts({ pageSize: 100 }),
        getCategories()
      ]);
      setProducts(prodData.items || []);
      setCategories(catData);
    } catch (err) {
      console.error(err);
      toast.error('Không thể lấy danh sách sản phẩm.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setSku('');
    setName('');
    setDescription('');
    setCategoryId('');
    setBasePrice('');
    setUnitOfMeasure('');
    setUnitsPerPackage('');
    setCoveragePerPackage('');
    setWastageRate('0.05');
    setImageUrl('');
    setAliasesText('');
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setSku(product.sku);
    setName(product.name);
    setDescription(product.description || '');
    setCategoryId(product.categoryId);
    setBasePrice(product.basePrice.toString());
    setUnitOfMeasure(product.unitOfMeasure);
    setUnitsPerPackage(product.unitsPerPackage ? product.unitsPerPackage.toString() : '');
    setCoveragePerPackage(product.coveragePerPackage ? product.coveragePerPackage.toString() : '');
    setWastageRate(product.wastageRate.toString());
    setImageUrl(product.imageUrl || '');
    
    // Map list of aliases back to comma-separated string
    const aliasStr = product.aliases ? product.aliases.map(a => a.aliasName || a).join(', ') : '';
    setAliasesText(aliasStr);
    
    setModalOpen(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này? (Soft-delete)')) {
      return;
    }

    try {
      await deleteProduct(id);
      toast.success('Đã xóa sản phẩm thành công!');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi xóa sản phẩm.');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!sku || !name || !categoryId || !basePrice || !unitOfMeasure) {
      toast.error('Vui lòng điền các trường bắt buộc.');
      return;
    }

    const priceVal = parseFloat(basePrice);
    const wastageVal = parseFloat(wastageRate);

    if (isNaN(priceVal) || priceVal <= 0) {
      toast.error('Đơn giá phải lớn hơn 0.');
      return;
    }

    setSubmitting(true);
    try {
      // Format aliases into list
      const aliasesList = aliasesText
        .split(',')
        .map(a => a.trim())
        .filter(a => a.length > 0);

      const payload = {
        sku,
        name,
        description,
        categoryId,
        basePrice: priceVal,
        unitOfMeasure,
        unitsPerPackage: unitsPerPackage ? parseFloat(unitsPerPackage) : null,
        coveragePerPackage: coveragePerPackage ? parseFloat(coveragePerPackage) : null,
        wastageRate: wastageVal,
        imageUrl: imageUrl || null,
        aliases: aliasesList.map(a => ({ aliasName: a })),
        specs: [],
        priceTiers: []
      };

      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
        toast.success('Cập nhật sản phẩm thành công!');
      } else {
        await createProduct(payload);
        toast.success('Thêm sản phẩm mới thành công!');
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi lưu sản phẩm.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Danh Mục Vật Tư</h1>
          <p className="text-xs text-zinc-500 mt-1">Quản lý danh sách sản phẩm, giá bán cơ sở và tỷ lệ hao hụt của hệ thống</p>
        </div>
        <Button 
          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs h-8 px-3 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
          onClick={openCreateModal}
        >
          <Plus className="h-4 w-4" /> Thêm Sản Phẩm Mới
        </Button>
      </div>

      {/* Products table */}
      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/10 p-12 text-center animate-pulse">
          Đang tải danh sách vật tư...
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-12 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/10">
          Chưa có sản phẩm nào trong danh mục.
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/20 overflow-hidden shadow-sm shadow-zinc-100/50 dark:shadow-none">
          <Table>
            <TableHeader className="bg-zinc-100 dark:bg-zinc-900/50">
              <TableRow className="border-zinc-200 dark:border-zinc-850">
                <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold">SKU</TableHead>
                <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold">Tên Vật Tư</TableHead>
                <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold">Phân Loại</TableHead>
                <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold">Giá Cơ Sở</TableHead>
                <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold">Đơn Vị (UoM)</TableHead>
                <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold">Trạng Thái</TableHead>
                <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold text-right">Thao Tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id} className="border-zinc-200 hover:bg-zinc-100/50 dark:border-zinc-850 dark:hover:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300 transition-colors">
                  <TableCell className="font-mono text-xs text-orange-600 dark:text-orange-500 font-semibold">{p.sku}</TableCell>
                  <TableCell className="font-semibold text-zinc-900 dark:text-white">{p.name}</TableCell>
                  <TableCell>{p.categoryName}</TableCell>
                  <TableCell className="font-bold">{p.basePrice.toLocaleString('vi-VN')}đ</TableCell>
                  <TableCell className="font-mono">{p.unitOfMeasure}</TableCell>
                  <TableCell>
                    {p.isActive ? (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-400/10 border border-emerald-500/25 px-2 py-0.5 rounded uppercase">
                        Đang bán
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded uppercase">
                        Ngưng bán
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right py-3 flex items-center justify-end gap-1.5">
                    {/* Standard edit button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 px-3 text-xs font-semibold rounded-lg border border-zinc-200 text-zinc-750 bg-white hover:text-zinc-950 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:bg-zinc-900/40 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                      onClick={() => openEditModal(p)}
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Sửa
                    </Button>
                    {/* Standard delete button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 px-3 text-xs font-semibold rounded-lg border border-red-200 bg-red-50 text-red-655 hover:bg-red-100 hover:text-red-800 hover:border-red-300 dark:border-red-955/40 dark:bg-red-955/20 dark:text-red-400 dark:hover:bg-red-900/50 dark:hover:text-red-100 dark:hover:border-red-900/40 transition-colors flex items-center gap-1.5"
                      onClick={() => handleDeleteProduct(p.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Xóa
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit/Create Product Modal Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-white border-zinc-200 text-zinc-800 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white max-w-lg overflow-y-auto max-h-[85vh] transition-all duration-300">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-zinc-900 dark:text-white">
              {editingProduct ? `Cập nhật sản phẩm: ${editingProduct.sku}` : 'Thêm sản phẩm mới'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 pt-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Mã SKU *</label>
                <Input
                  type="text"
                  placeholder="VLXD-XXXX"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  required
                  className="bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-650 rounded-lg text-xs h-10 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Phân Loại Nhóm *</label>
                <select 
                  className="w-full bg-zinc-55 border border-zinc-300 rounded-lg text-xs text-zinc-900 px-3 py-2.5 focus:outline-none focus:border-orange-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white transition-colors"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Tên sản phẩm *</label>
              <Input
                type="text"
                placeholder="Tên đầy đủ của vật tư xây dựng"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-955 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-650 rounded-lg text-xs h-10 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Mô tả sản phẩm</label>
              <Textarea
                placeholder="Mô tả công dụng, tính chất vật lý của sản phẩm..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-650 rounded-lg text-xs transition-colors"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1 col-span-2">
                <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Giá bán cơ sở (đ) *</label>
                <Input
                  type="number"
                  placeholder="95000"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  required
                  className="bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-650 rounded-lg text-xs h-10 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Đơn vị (UoM) *</label>
                <Input
                  type="text"
                  placeholder="Thùng, Bao, Khối"
                  value={unitOfMeasure}
                  onChange={(e) => setUnitOfMeasure(e.target.value)}
                  required
                  className="bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-650 rounded-lg text-xs h-10 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t border-zinc-200 dark:border-zinc-800/60 pt-4">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Số viên / Đóng gói</label>
                <Input
                  type="number"
                  placeholder="6"
                  value={unitsPerPackage}
                  onChange={(e) => setUnitsPerPackage(e.target.value)}
                  className="bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-650 rounded-lg text-xs h-10 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Độ phủ (m² / thùng)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.96"
                  value={coveragePerPackage}
                  onChange={(e) => setCoveragePerPackage(e.target.value)}
                  className="bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-650 rounded-lg text-xs h-10 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Hao hụt định mức</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.05"
                  value={wastageRate}
                  onChange={(e) => setWastageRate(e.target.value)}
                  className="bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-650 rounded-lg text-xs h-10 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1 border-t border-zinc-200 dark:border-zinc-800/60 pt-4">
              <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Từ đồng nghĩa tìm kiếm AI (phân cách bằng dấu phẩy)</label>
              <Input
                type="text"
                placeholder="gach terrazzo, gach lat san, terrazzo"
                value={aliasesText}
                onChange={(e) => setAliasesText(e.target.value)}
                className="bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-650 rounded-lg text-xs h-10 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 dark:text-zinc-400 uppercase font-semibold">Đường dẫn hình ảnh (URL)</label>
              <Input
                type="text"
                placeholder="http://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-650 rounded-lg text-xs h-10 transition-colors"
              />
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Button 
                type="button" 
                variant="outline" 
                className="border border-zinc-200 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-800 dark:border-zinc-800 dark:hover:bg-zinc-955 dark:text-zinc-400 dark:hover:text-white transition-colors"
                onClick={() => setModalOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors"
              >
                {submitting ? 'Đang lưu...' : 'Lưu sản phẩm'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
