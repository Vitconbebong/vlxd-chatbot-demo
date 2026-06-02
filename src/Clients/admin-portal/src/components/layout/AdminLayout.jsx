import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import AdminSidebar from './AdminSidebar';
import TopBar from './TopBar';

export default function AdminLayout() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white transition-colors duration-300 overflow-hidden selection:bg-orange-500 selection:text-white">
      {/* Toast alerts */}
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#18181b',
            color: '#fff',
            border: '1px solid #27272a'
          }
        }} 
      />

      {/* Sidebar Panel */}
      <AdminSidebar />

      {/* Content Area */}
      <div className="flex flex-col flex-grow overflow-hidden">
        {/* Header bar */}
        <TopBar />

        {/* Scrollable page body */}
        <main className="flex-grow overflow-y-auto p-6 md:p-8 bg-zinc-100/30 dark:bg-zinc-950/60 transition-colors duration-300">
          <React.Suspense fallback={
            <div className="space-y-6 animate-pulse">
              <div className="h-10 bg-zinc-900 rounded w-1/4"></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="h-28 bg-zinc-900 rounded"></div>
                <div className="h-28 bg-zinc-900 rounded"></div>
                <div className="h-28 bg-zinc-900 rounded"></div>
                <div className="h-28 bg-zinc-900 rounded"></div>
              </div>
              <div className="h-96 bg-zinc-900 rounded"></div>
            </div>
          }>
            <Outlet />
          </React.Suspense>
        </main>
      </div>
    </div>
  );
}
