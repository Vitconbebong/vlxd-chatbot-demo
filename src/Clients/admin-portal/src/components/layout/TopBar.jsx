import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Shield, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/button';

export default function TopBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

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

  // Synchronize changes from other tabs instantly
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'theme') {
        setIsDarkMode(e.newValue === 'dark');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex items-center justify-between px-6 sticky top-0 z-30 transition-colors duration-300">
      <div>
        <h2 className="text-sm font-semibold text-zinc-650 dark:text-zinc-400">
          Hệ thống điều hành VLXD Smart System
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Toggle Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="h-8 w-8 p-0 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-650 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title={isDarkMode ? "Chuyển sang chế độ Sáng" : "Chuyển sang chế độ Tối"}
        >
          {isDarkMode ? <Sun className="h-4 w-4 text-orange-400" /> : <Moon className="h-4 w-4 text-zinc-550" />}
        </Button>

        {/* User Card */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
            <Shield className="h-4 w-4 text-orange-500" />
            <span className="text-xs font-bold text-zinc-900 dark:text-white">{user?.fullName}</span>
            <span className="rounded bg-orange-500/10 px-1.5 py-0.5 text-[9px] font-bold text-orange-600 dark:text-orange-400 border border-orange-500/20 uppercase tracking-wider">
              {user?.role}
            </span>
          </div>
        </div>

        {/* Logout */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-zinc-550 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-1.5 text-zinc-500" />
          <span className="text-xs font-semibold">Đăng xuất</span>
        </Button>
      </div>
    </header>
  );
}
