import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Warehouse, 
  Hammer, 
  Truck, 
  MessageSquare, 
  Ticket,
  ChevronRight,
  Users,
  MapPin,
  FolderTree,
  Cpu
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function AdminSidebar() {
  const location = useLocation();
  const { user } = useAuthStore();
  const role = user?.role;

  const menuItems = [
    { name: 'Tổng quan', path: '/', icon: LayoutDashboard },
    { name: 'Đơn hàng', path: '/orders', icon: ShoppingBag },
    { name: 'Tồn kho & Nhập kho', path: '/inventory', icon: Warehouse },
    { name: 'Danh mục vật tư', path: '/products', icon: Hammer },
    { name: 'Giao hàng & Đội xe', path: '/deliveries', icon: Truck },
    { name: 'Quản lý kho', path: '/warehouses', icon: MapPin },
    { name: 'Quản lý phân loại', path: '/categories', icon: FolderTree },
    { name: 'AI Báo giá nháp', path: '/quotations', icon: MessageSquare },
    { name: 'Yêu cầu hỗ trợ', path: '/tickets', icon: Ticket },
    { name: 'Quản lý AI', path: '/ai-management', icon: Cpu, adminOnly: true },
    { name: 'Quản lý tài khoản', path: '/accounts', icon: Users, adminOnly: true },
  ];

  const filteredItems = menuItems.filter(item => !item.adminOnly || role === 'Admin');

  return (
    <aside className="w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 flex flex-col h-screen shrink-0 sticky top-0 transition-colors duration-300">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50/40 dark:bg-zinc-950/40">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-orange-500">
          <Hammer className="h-5 w-5 text-orange-500 animate-pulse" />
          <span>VLXD<span className="text-zinc-950 dark:text-white font-light">Admin</span></span>
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-grow p-4 space-y-1.5">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center justify-between px-4 py-3 rounded-lg text-xs font-semibold tracking-wide transition-all group ${
                isActive 
                  ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/25' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 transition-colors ${isActive ? 'text-orange-500' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white'}`} />
                <span>{item.name}</span>
              </div>
              <ChevronRight className={`h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100 text-orange-500' : ''}`} />
            </Link>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-900 text-[10px] text-zinc-400 dark:text-zinc-600 text-center">
        <span>VLXD Smart Admin v1.0.0</span>
      </div>
    </aside>
  );
}
