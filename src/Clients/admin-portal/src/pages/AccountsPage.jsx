import React, { useEffect, useState } from 'react';
import { getAccounts, createAccount, updateAccount } from '../api/auth';
import { Users, Plus, ShieldCheck, Mail, Phone, Calendar, RefreshCw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import toast from 'react-hot-toast';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Employee');
  const [customerTier, setCustomerTier] = useState('Retail');
  const [address, setAddress] = useState('');

  const openCreateModal = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
    setRole('Employee');
    setCustomerTier('Retail');
    setAddress('');
    setSelectedAccountId(null);
    setCreateModalOpen(true);
  };

  const openEditModal = (account) => {
    setSelectedAccountId(account.id);
    setEmail(account.email || '');
    setPassword('');
    setFullName(account.fullName || '');
    setPhone(account.phoneNumber || '');
    setRole(account.roles?.[0] || 'Employee');
    setCustomerTier(account.customerTier || 'Retail');
    setAddress(account.address || '');
    setEditModalOpen(true);
  };

  const handleEditAccountSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !fullName.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }

    setSubmitting(true);
    try {
      await updateAccount(selectedAccountId, {
        email,
        password: password ? password : null,
        fullName,
        phone: phone || undefined,
        role,
        customerTier: role === 'Customer' ? customerTier : undefined,
        address: role === 'Customer' ? address : undefined
      });
      toast.success('Đã cập nhật thông tin tài khoản thành công!');
      setEditModalOpen(false);
      
      // Reset form
      setEmail('');
      setPassword('');
      setFullName('');
      setPhone('');
      setRole('Employee');
      setCustomerTier('Retail');
      setAddress('');
      setSelectedAccountId(null);
      
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật tài khoản.');
    } finally {
      setSubmitting(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAccounts();
      setAccounts(data);
    } catch (err) {
      console.error(err);
      toast.error('Không thể tải danh sách tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAccountSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !fullName.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }

    setSubmitting(true);
    try {
      await createAccount({
        email,
        password,
        fullName,
        phone: phone || undefined,
        role,
        customerTier: role === 'Customer' ? customerTier : undefined,
        address: role === 'Customer' ? address : undefined
      });
      toast.success('Đã tạo tài khoản mới thành công!');
      setCreateModalOpen(false);
      
      // Reset form
      setEmail('');
      setPassword('');
      setFullName('');
      setPhone('');
      setRole('Employee');
      setCustomerTier('Retail');
      setAddress('');
      
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo tài khoản.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadge = (roles) => {
    if (!roles || roles.length === 0) return 'bg-zinc-800 text-zinc-500 border-zinc-700';
    const mainRole = roles[0];
    switch (mainRole.toLowerCase()) {
      case 'admin':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/25 font-bold shadow-[0_0_12px_rgba(244,63,94,0.15)] animate-pulse';
      case 'employee':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20 font-bold';
      case 'customer':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default:
        return 'bg-zinc-800 text-zinc-450 border-zinc-700';
    }
  };

  const getRoleLabel = (roles) => {
    if (!roles || roles.length === 0) return 'Không xác định';
    const mainRole = roles[0];
    switch (mainRole.toLowerCase()) {
      case 'admin': return 'Quản trị viên';
      case 'employee': return 'Nhân viên';
      case 'customer': return 'Khách hàng';
      default: return mainRole;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-orange-500" />
            Quản lý Tài Khoản
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Phân quyền, theo dõi danh sách tài khoản quản trị và khách hàng hội viên</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs h-8 px-3 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
            onClick={openCreateModal}
          >
            <Plus className="h-4 w-4" /> Thêm tài khoản mới
          </Button>
        </div>
      </div>

      {/* Main content table */}
      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/10 p-12 text-center text-zinc-500 animate-pulse flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-orange-500" />
          <span>Đang tải thông tin người dùng...</span>
        </div>
      ) : accounts.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-12 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/10">
          Không tìm thấy tài khoản người dùng nào.
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/20 overflow-hidden shadow-sm shadow-zinc-100/50 dark:shadow-none">
          <Table>
            <TableHeader className="bg-zinc-100 dark:bg-zinc-900/50">
              <TableRow className="border-zinc-200 dark:border-zinc-850">
                <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold">Họ và Tên</TableHead>
                <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold">Tài Khoản / Email</TableHead>
                <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold text-center">Vai Trò</TableHead>
                <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold text-center">Số Điện Thoại</TableHead>
                <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold text-center">Hạng Hội Viên</TableHead>
                <TableHead className="text-zinc-700 dark:text-zinc-400 text-xs font-bold text-right">Thao Tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((acc) => (
                <TableRow key={acc.id} className="border-zinc-200 hover:bg-zinc-100/50 dark:border-zinc-850 dark:hover:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300 transition-colors">
                  <TableCell className="font-semibold text-zinc-900 dark:text-white">{acc.fullName}</TableCell>
                  <TableCell className="font-mono text-xs">{acc.email}</TableCell>
                  <TableCell className="text-center">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${getRoleBadge(acc.roles)}`}>
                      {getRoleLabel(acc.roles)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-mono text-xs">{acc.phoneNumber || 'N/A'}</TableCell>
                  <TableCell className="text-center">
                    {acc.roles && acc.roles[0]?.toLowerCase() === 'customer' ? (
                      <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold bg-orange-400/5 border border-orange-500/20 px-2 py-0.5 rounded">
                        {acc.customerTier || 'Retail'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-600 italic">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 px-3 text-xs font-semibold rounded-lg border border-zinc-200 text-zinc-750 bg-white hover:text-zinc-955 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:bg-zinc-900/40 dark:hover:text-white dark:hover:bg-zinc-800 transition-colors"
                      onClick={() => openEditModal(acc)}
                    >
                      Sửa
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Accounts Create Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="bg-white border-zinc-200 text-zinc-800 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white max-w-md transition-all duration-300">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-orange-500" />
              Tạo Tài Khoản Người Dùng
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateAccountSubmit} className="space-y-4 pt-4 text-sm">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Họ và tên *</label>
              <Input
                type="text"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-650 rounded-lg text-xs h-10 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Email đăng nhập *</label>
                <Input
                  type="email"
                  placeholder="nhanvien@vlxd.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-650 rounded-lg text-xs h-10 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Mật khẩu *</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-650 rounded-lg text-xs h-10 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Số điện thoại</label>
                <Input
                  type="tel"
                  placeholder="0909123456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-650 rounded-lg text-xs h-10 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Vai trò hệ thống *</label>
                <select 
                  className="w-full bg-zinc-50 border border-zinc-300 rounded-lg text-xs text-zinc-900 px-3 py-2.5 focus:outline-none focus:border-orange-500 h-10 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white transition-colors"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="Employee">Nhân viên (Employee)</option>
                  <option value="Admin">Quản trị viên (Admin)</option>
                  <option value="Customer">Khách hàng (Customer)</option>
                </select>
              </div>
            </div>

            {role === 'Customer' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Cấp bậc khách hàng</label>
                  <select 
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-lg text-xs text-zinc-900 px-3 py-2.5 focus:outline-none focus:border-orange-500 h-10 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white transition-colors"
                    value={customerTier}
                    onChange={(e) => setCustomerTier(e.target.value)}
                  >
                    <option value="Retail">Retail (Bán lẻ)</option>
                    <option value="Contractor">Contractor (Nhà thầu)</option>
                    <option value="Dealer">Dealer (Đại lý)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Địa chỉ giao hàng mặc định</label>
                  <Textarea
                    placeholder="Nhập địa chỉ của khách hàng"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className="bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-650 rounded-lg text-xs transition-colors"
                  />
                </div>
              </>
            )}

            <div className="flex gap-3 justify-end pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Button 
                type="button" 
                variant="outline" 
                className="border border-zinc-200 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-800 dark:border-zinc-800 dark:hover:bg-zinc-955 dark:text-zinc-400 dark:hover:text-white transition-colors"
                onClick={() => setCreateModalOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs h-10 px-6 transition-colors"
              >
                {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Accounts Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="bg-white border-zinc-200 text-zinc-800 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white max-w-md transition-all duration-300">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-orange-500" />
              Cập Nhật Tài Khoản Người Dùng
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditAccountSubmit} className="space-y-4 pt-4 text-sm">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Họ và tên *</label>
              <Input
                type="text"
                placeholder="Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-650 rounded-lg text-xs h-10 transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-555 dark:text-zinc-400 uppercase tracking-wider">Email đăng nhập *</label>
                <Input
                  type="email"
                  placeholder="nhanvien@vlxd.local"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-zinc-100 border-zinc-200 text-zinc-500 rounded-lg text-xs h-10 dark:bg-zinc-950 dark:border-zinc-850 dark:text-zinc-400 opacity-70 cursor-not-allowed transition-colors"
                  disabled
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Mật khẩu mới (Để trống nếu giữ nguyên)</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-650 rounded-lg text-xs h-10 transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Số điện thoại</label>
                <Input
                  type="tel"
                  placeholder="0909123456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-650 rounded-lg text-xs h-10 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-zinc-555 dark:text-zinc-400 uppercase tracking-wider">Vai trò hệ thống *</label>
                <select 
                  className="w-full bg-zinc-100 border border-zinc-200 text-zinc-500 px-3 py-2.5 focus:outline-none h-10 dark:bg-zinc-950 dark:border-zinc-850 dark:text-zinc-400 opacity-70 cursor-not-allowed rounded-lg text-xs transition-colors"
                  value={role}
                  disabled
                >
                  <option value="Employee">Nhân viên (Employee)</option>
                  <option value="Admin">Quản trị viên (Admin)</option>
                  <option value="Customer">Khách hàng (Customer)</option>
                </select>
              </div>
            </div>

            {role === 'Customer' && (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Cấp bậc khách hàng</label>
                  <select 
                    className="w-full bg-zinc-50 border border-zinc-300 rounded-lg text-xs text-zinc-900 px-3 py-2.5 focus:outline-none focus:border-orange-500 h-10 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white transition-colors"
                    value={customerTier}
                    onChange={(e) => setCustomerTier(e.target.value)}
                  >
                    <option value="Retail">Retail (Bán lẻ)</option>
                    <option value="Contractor">Contractor (Nhà thầu)</option>
                    <option value="Dealer">Dealer (Đại lý)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Địa chỉ giao hàng mặc định</label>
                  <Textarea
                    placeholder="Nhập địa chỉ của khách hàng"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className="bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-650 rounded-lg text-xs transition-colors"
                  />
                </div>
              </>
            )}

            <div className="flex gap-3 justify-end pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Button 
                type="button" 
                variant="outline" 
                className="border border-zinc-200 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-800 dark:border-zinc-800 dark:hover:bg-zinc-955 dark:text-zinc-400 dark:hover:text-white transition-colors"
                onClick={() => setEditModalOpen(false)}
              >
                Hủy bỏ
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs h-10 px-6 transition-colors"
              >
                {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
