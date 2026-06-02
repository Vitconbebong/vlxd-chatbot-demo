import React from 'react';
import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './Header';
import Footer from './Footer';
import AIChatWidget from '../chat/AIChatWidget';

export default function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white transition-colors duration-300 selection:bg-orange-500 selection:text-white">
      {/* Toast notifications */}
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

      {/* Main Header */}
      <Header />

      {/* Page Content */}
      <main className="flex-grow">
        <React.Suspense fallback={
          <div className="container mx-auto px-4 py-8 space-y-6 animate-pulse">
            <div className="h-12 bg-zinc-900 rounded-lg w-1/3"></div>
            <div className="h-64 bg-zinc-900 rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-40 bg-zinc-900 rounded-lg"></div>
              <div className="h-40 bg-zinc-900 rounded-lg"></div>
              <div className="h-40 bg-zinc-900 rounded-lg"></div>
            </div>
          </div>
        }>
          <Outlet />
        </React.Suspense>
      </main>

      {/* Main Footer */}
      <Footer />

      {/* Floating AI Consultant */}
      <AIChatWidget />
    </div>
  );
}

