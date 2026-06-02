import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, LogOut, User, LayoutDashboard, Menu, X, Hammer, Sun, Moon } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/button';

export default function Header() {
  const navigate = useNavigate();
  const cartItems = useCartStore((state) => state.items);
  const { user, logout, isAuthenticated } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync state with HTML dark class and localStorage
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Instantly synchronize theme selection across browser tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'theme') {
        setIsDarkMode(e.newValue === 'dark');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/85 dark:bg-zinc-950/80 text-zinc-900 dark:text-white backdrop-blur-md transition-colors duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-orange-500">
            <Hammer className="h-6 w-6 text-orange-500 animate-pulse" />
            <span>VLXD<span className="text-zinc-900 dark:text-white font-light">Smart</span></span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          <Link to="/" className="hover:text-orange-500 dark:hover:text-orange-500 transition-colors">Trang chủ</Link>
          <Link to="/products" className="hover:text-orange-500 dark:hover:text-orange-500 transition-colors">Sản phẩm</Link>
          {isAuthenticated && (
            <Link to="/orders" className="hover:text-orange-500 dark:hover:text-orange-500 transition-colors">Đơn hàng của tôi</Link>
          )}
        </nav>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="h-8 w-8 p-0 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-650 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-105 dark:hover:bg-zinc-800 transition-colors"
            title={isDarkMode ? "Chuyển sang chế độ Sáng" : "Chuyển sang chế độ Tối"}
          >
            {isDarkMode ? <Sun className="h-4 w-4 text-orange-400" /> : <Moon className="h-4 w-4 text-zinc-550" />}
          </Button>

          {/* Cart link */}
          <Link to="/cart" className="relative p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
            <ShoppingCart className="h-6 w-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-xs font-bold text-white ring-2 ring-white dark:ring-zinc-950">
                {cartCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                <User className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-semibold max-w-[120px] truncate">{user?.fullName}</span>
                <span className="rounded bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-medium text-orange-600 dark:text-orange-400 border border-orange-500/20">
                  {user?.customerTier || 'Retail'}
                </span>
              </div>

              {(user?.role === 'Admin' || user?.role === 'Employee') && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-955 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  onClick={() => window.open('http://localhost:5174', '_blank')}
                >
                  <LayoutDashboard className="mr-1.5 h-4 w-4 text-orange-500" />
                  Quản lý
                </Button>
              )}

              <Button 
                variant="ghost" 
                size="sm" 
                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button className="bg-orange-600 text-white hover:bg-orange-500 font-semibold shadow-md shadow-orange-500/10">
                Đăng nhập
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile menu and toggle */}
        <div className="flex md:hidden items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="h-8 w-8 p-0 rounded-lg text-zinc-650 dark:text-zinc-350 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          >
            {isDarkMode ? <Sun className="h-4 w-4 text-orange-400" /> : <Moon className="h-4 w-4 text-zinc-500" />}
          </Button>

          <Link to="/cart" className="relative p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
            <ShoppingCart className="h-6 w-6" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-xs font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            type="button"
            className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-4 space-y-3 transition-colors duration-300">
          <Link 
            to="/" 
            className="block text-zinc-700 dark:text-zinc-300 hover:text-orange-500 py-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            Trang chủ
          </Link>
          <Link 
            to="/products" 
            className="block text-zinc-700 dark:text-zinc-300 hover:text-orange-500 py-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            Sản phẩm
          </Link>
          {isAuthenticated && (
            <Link 
              to="/orders" 
              className="block text-zinc-700 dark:text-zinc-300 hover:text-orange-500 py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Đơn hàng của tôi
            </Link>
          )}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3">
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="text-zinc-700 dark:text-zinc-300 font-semibold flex items-center gap-2">
                  <User className="h-4 w-4 text-orange-500" />
                  <span>{user?.fullName} ({user?.customerTier || 'Retail'})</span>
                </div>
                <Button 
                  className="w-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                </Button>
              </div>
            ) : (
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold">
                  Đăng nhập
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
