import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Hammer } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, loading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    const res = await login(email, password);
    if (res.success) {
      toast.success('Đăng nhập thành công!');
      const redirect = searchParams.get('redirect') || '';
      navigate(redirect ? `/${redirect}` : '/');
    } else {
      toast.error(res.error || 'Tài khoản hoặc mật khẩu không hợp lệ.');
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/20 p-8 shadow-2xl backdrop-blur-md shadow-zinc-200/50 dark:shadow-none">
        
        {/* Brand/Title */}
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-orange-600/10 text-orange-500 border border-orange-500/20">
            <Hammer className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">Đăng nhập tài khoản</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Trải nghiệm nền tảng báo giá và hỗ trợ tư vấn thông minh
          </p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Tài khoản Email</label>
            <Input
              type="email"
              placeholder="khach@vlxd.local, admin@vlxd.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-600 rounded-lg text-sm h-11"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Mật khẩu</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-600 rounded-lg text-sm h-11"
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold shadow-lg shadow-orange-600/20 h-11 mt-6 transition-all"
          >
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </Button>
        </form>

        {/* Seed Info block */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 p-4 space-y-2 text-[11px] text-zinc-650 dark:text-zinc-500">
          <p className="font-bold text-zinc-800 dark:text-zinc-450">Tài khoản mẫu để thử nghiệm:</p>
          <div className="grid grid-cols-2 gap-2 font-mono">
            <div>
              <p className="text-orange-500/80">Khách B2C/B2B:</p>
              <p>khach@vlxd.local</p>
              <p>Khach@123</p>
            </div>
            <div>
              <p className="text-orange-500/80">Quản trị Admin:</p>
              <p>admin@vlxd.local</p>
              <p>Admin@123</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
