import React, { useEffect, useState } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory, getProducts } from '../api/catalog';
import { FolderTree, Plus, Edit2, Trash2, Folder, RefreshCw, ChevronRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import toast from 'react-hot-toast';

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState([]);
  const [flatCategories, setFlatCategories] = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [sortOrder, setSortOrder] = useState(0);

  // Flattens the category tree for rendering in the table
  const flattenTree = (list, depth = 0, parentName = '') => {
    let result = [];
    list.forEach((item) => {
      result.push({
        id: item.id,
        name: item.name,
        parentId: item.parentId,
        sortOrder: item.sortOrder,
        depth,
        parentName: parentName || 'Không có (Cấp cao nhất)'
      });
      if (item.children && item.children.length > 0) {
        result.push(...flattenTree(item.children, depth + 1, item.name));
      }
    });
    return result;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const catTree = await getCategories();
      const prodData = await getProducts({ page: 1, pageSize: 1000 });
      
      // Calculate product counts per category
      const counts = {};
      if (prodData && prodData.items) {
        prodData.items.forEach(p => {
          counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
        });
      }
      setProductCounts(counts);
      setCategories(catTree);
      setFlatCategories(flattenTree(catTree));
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải thông tin danh mục phân loại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setName('');
    setParentId('');
    setSortOrder(0);
    setEditMode(false);
    setSelectedCategoryId(null);
    setModalOpen(true);
  };

  const openEditModal = (cat) => {
    setName(cat.name);
    setParentId(cat.parentId || '');
    setSortOrder(cat.sortOrder || 0);
    setEditMode(true);
    setSelectedCategoryId(cat.id);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên phân loại.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name,
        parentId: parentId === '' ? null : parentId,
        sortOrder: parseInt(sortOrder, 10) || 0
      };

      if (editMode) {
        await updateCategory(selectedCategoryId, payload);
        toast.success('Cập nhật phân loại thành công!');
      } else {
        await createCategory(payload);
        toast.success('Thêm phân loại mới thành công!');
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

  const handleDelete = async (id, catName) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa phân loại "${catName}"?`)) {
      return;
    }

    try {
      await deleteCategory(id);
      toast.success('Đã xóa phân loại thành công.');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Không thể xóa phân loại này. Vui lòng kiểm tra xem có chứa phân loại con hoặc sản phẩm nào không.');
    }
  };

  // Helper to filter dropdown options so a category cannot select itself as parent
  const getEligibleParents = () => {
    if (!editMode) return flatCategories;
    return flatCategories.filter(c => c.id !== selectedCategoryId);
  };

  return (
    <div className="p-6 rounded-2xl border transition-all duration-350 space-y-6 bg-white border-zinc-200 text-zinc-800 shadow-sm shadow-zinc-100/50 dark:bg-zinc-950/40 dark:border-zinc-800/80 dark:text-zinc-100 dark:shadow-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold flex items-center gap-2 text-zinc-900 dark:text-white">
            <FolderTree className="h-6 w-6 text-orange-500" />
            Quản Lý Phân Loại
          </h1>
          <p className="text-xs mt-1 text-zinc-500 dark:text-zinc-400">
            Xem và cấu hình sơ đồ phân cấp danh mục vật liệu xây dựng toàn hệ thống.
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
            Thêm phân loại
          </Button>
        </div>
      </div>

      {/* Content Table */}
      {loading ? (
        <div className="flex items-center justify-center p-12 text-sm text-zinc-500 dark:text-zinc-400">
          <RefreshCw className="h-5 w-5 animate-spin text-orange-500 mr-2" />
          <span>Đang tải thông tin phân loại danh mục...</span>
        </div>
      ) : flatCategories.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900/10 dark:text-zinc-500 p-12 text-center text-sm">
          Không tìm thấy phân loại nào trong hệ thống.
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-250 bg-zinc-50/30 dark:border-zinc-800 dark:bg-zinc-900/20 overflow-hidden transition-colors">
          <Table>
            <TableHeader className="bg-zinc-100 dark:bg-zinc-900/50">
              <TableRow className="border-zinc-200 dark:border-zinc-850 hover:bg-transparent">
                <TableHead className="text-xs font-bold w-1/3 text-zinc-700 dark:text-zinc-400">Tên Phân Loại</TableHead>
                <TableHead className="text-xs font-bold text-zinc-700 dark:text-zinc-400">Danh Mục Cha</TableHead>
                <TableHead className="text-xs font-bold text-center text-zinc-700 dark:text-zinc-400">Thứ Tự Hiển Thị</TableHead>
                <TableHead className="text-xs font-bold text-center text-zinc-700 dark:text-zinc-400">Số Mặt Hàng</TableHead>
                <TableHead className="text-xs font-bold text-right text-zinc-700 dark:text-zinc-400">Thao Tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flatCategories.map((cat) => (
                <TableRow 
                  key={cat.id} 
                  className="border-b border-zinc-200 hover:bg-zinc-100/50 text-zinc-700 dark:border-zinc-850 dark:hover:bg-zinc-900/40 dark:text-zinc-300 transition-colors"
                >
                  <TableCell className="font-semibold text-zinc-900 dark:text-white">
                    <div 
                      className="flex items-center" 
                      style={{ paddingLeft: `${cat.depth * 20}px` }}
                    >
                      {cat.depth > 0 && (
                        <span className="mr-1.5 font-mono text-zinc-400 dark:text-zinc-650">└─</span>
                      )}
                      <Folder className={`h-4 w-4 mr-2 ${cat.depth === 0 ? 'text-orange-500' : 'text-orange-500/70'}`} />
                      <span>{cat.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-zinc-650 dark:text-zinc-450">{cat.parentName}</TableCell>
                  <TableCell className="text-center font-mono text-xs">{cat.sortOrder}</TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold border transition-colors w-8 bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-350 dark:border-zinc-700">
                      {productCounts[cat.id] || 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      {/* Uniform Edit Button */}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-3 text-xs font-semibold rounded-lg border border-zinc-200 text-zinc-750 bg-white hover:text-zinc-955 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:bg-zinc-900/40 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                        onClick={() => openEditModal(cat)}
                      >
                        <Edit2 className="h-3 w-3" />
                        Sửa
                      </Button>

                      {/* Uniform Delete Button */}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-3 text-xs font-semibold rounded-lg border border-red-200 bg-red-50 text-red-650 hover:bg-red-100 hover:text-red-800 hover:border-red-300 dark:border-red-950/40 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-900/50 dark:hover:text-red-100 dark:hover:border-red-900/40 transition-colors flex items-center gap-1.5"
                        onClick={() => handleDelete(cat.id, cat.name)}
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

      {/* Category Edit / Create Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="border max-w-md bg-white border-zinc-200 text-zinc-800 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white transition-all duration-300">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-zinc-900 dark:text-white">
              <FolderTree className="h-5 w-5 text-orange-500" />
              {editMode ? 'Cập Nhật Phân Loại' : 'Tạo Phân Loại Mới'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-sm">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Tên phân loại *</label>
              <Input
                type="text"
                placeholder="Cát xây dựng / Xi măng / Gạch men..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-lg text-xs h-10 bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-650 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Danh mục cha (Cấp trên)</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full border rounded-lg text-xs h-10 px-3 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 bg-zinc-50 border-zinc-300 text-zinc-900 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white transition-colors"
              >
                <option value="">Không có (Cấp cao nhất)</option>
                {getEligibleParents().map(c => (
                  <option key={c.id} value={c.id}>
                    {catPrefix(c.depth)} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Thứ tự sắp xếp hiển thị</label>
              <Input
                type="number"
                placeholder="0"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="rounded-lg text-xs h-10 bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-955 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-650 transition-colors"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="border border-zinc-200 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-800 dark:border-zinc-800 dark:hover:bg-zinc-955 dark:text-zinc-400 dark:hover:text-white transition-colors"
                onClick={() => setModalOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-sm transition-colors"
              >
                {submitting ? 'Đang xử lý...' : editMode ? 'Lưu thay đổi' : 'Tạo mới'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Simple helper to draw visual hierarchy inside the select dropdown options
function catPrefix(depth) {
  if (depth === 0) return '';
  return '─'.repeat(depth) + ' ';
}
