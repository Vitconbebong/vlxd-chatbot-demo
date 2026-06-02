import React, { useEffect, useState } from 'react';
import { getDashboardStats } from '../api/sales';
import { 
  DollarSign, 
  ShoppingBag, 
  Package, 
  AlertTriangle,
  TrendingUp,
  Activity
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48 bg-zinc-800" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full bg-zinc-800 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-80 bg-zinc-800 rounded-xl" />
          <Skeleton className="h-80 bg-zinc-800 rounded-xl" />
        </div>
      </div>
    );
  }

  const cardData = [
    {
      title: 'Doanh thu tháng',
      value: `${(stats?.totalRevenue || 0).toLocaleString('vi-VN')}đ`,
      desc: 'Doanh thu từ đơn đặt đã xác nhận',
      icon: DollarSign,
      color: 'text-orange-500 bg-orange-500/10'
    },
    {
      title: 'Tổng số đơn hàng',
      value: stats?.orderCount || 0,
      desc: 'Tất cả các đơn đã phát sinh',
      icon: ShoppingBag,
      color: 'text-amber-500 bg-amber-500/10'
    },
    {
      title: 'Vật tư trong kho',
      value: stats?.productsCount || 0,
      desc: 'Số lượng sản phẩm trong catalog',
      icon: Package,
      color: 'text-blue-500 bg-blue-500/10'
    },
    {
      title: 'Cảnh báo hết hàng',
      value: stats?.lowStockCount || 0,
      desc: 'Sản phẩm có tồn kho dưới 10',
      icon: AlertTriangle,
      color: stats?.lowStockCount > 0 ? 'text-red-500 bg-red-500/10' : 'text-zinc-500 bg-zinc-100 dark:bg-zinc-800'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Bảng Điều Khiển Tổng Quan</h1>
          <p className="text-xs text-zinc-500 mt-1">Thông tin cập nhật hoạt động kinh doanh vật liệu xây dựng</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cardData.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="bg-white dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 shadow-sm shadow-zinc-100/50 dark:shadow-none">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500 font-semibold">{card.title}</p>
                  <p className="text-xl font-black text-zinc-900 dark:text-white">{card.value}</p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-600">{card.desc}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts & Top Products section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart (2/3 width) */}
        <Card className="lg:col-span-2 bg-white dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 shadow-sm shadow-zinc-100/50 dark:shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              Doanh thu 7 ngày qua
            </CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.revenueLast7Days || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" vertical={false} />
                <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card-bg, #18181b)', borderColor: 'var(--border-color, #27272a)', color: 'var(--text-color, #fff)' }}
                  formatter={(value) => [`${value.toLocaleString('vi-VN')}đ`, 'Doanh thu']}
                />
                <Bar dataKey="revenue" fill="#ea580c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top selling list (1/3 width) */}
        <Card className="bg-white dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 shadow-sm shadow-zinc-100/50 dark:shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-orange-500" />
              Top 5 sản phẩm bán chạy nhất
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.topProducts && stats.topProducts.length > 0 ? (
              stats.topProducts.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-2 border-b border-zinc-100 dark:border-zinc-800/60 last:border-0">
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">{p.productName}</p>
                    <p className="text-zinc-500 mt-0.5">SKU: {p.sku} • Đã bán: {p.quantitySold}</p>
                  </div>
                  <span className="font-extrabold text-orange-600 dark:text-orange-400 shrink-0">
                    {p.revenue.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              ))
            ) : (
              <div className="flex h-48 items-center justify-center text-zinc-500 italic">
                Chưa có dữ liệu giao dịch.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
