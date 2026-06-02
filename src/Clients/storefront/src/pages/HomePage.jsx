import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Hammer,
  Bot,
  Calculator,
  ShieldCheck,
  Compass,
  ArrowRight,
} from "lucide-react";
import { getProducts, getCategories } from "../api/catalog";
import ProductGrid from "../components/product/ProductGrid";
import { Button } from "../components/ui/button";

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [catData, prodData] = await Promise.all([
          getCategories(),
          getProducts({ pageSize: 4 }),
        ]);
        setCategories(catData.slice(0, 6)); // Show first 6 categories
        setFeaturedProducts(prodData.items || []);
      } catch (err) {
        console.error("Failed to load home page data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-zinc-50 dark:bg-zinc-950 py-24 sm:py-32 border-b border-zinc-200 dark:border-zinc-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-500/10 via-zinc-50 to-zinc-50 dark:from-orange-950/20 dark:via-zinc-950 dark:to-zinc-950" />
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-orange-600/5 blur-[120px] rounded-full" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/20 bg-orange-500/5 text-orange-600 dark:text-orange-400 text-xs font-semibold">
            <Bot className="h-4 w-4" />
            Hệ thống AI tư vấn vật liệu & báo giá tự động
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight max-w-4xl mx-auto">
            Giải Pháp Vật Liệu{" "}
            <span className="bg-gradient-to-r from-orange-500 to-amber-400 bg-clip-text text-transparent">
              Thông Minh & Tối Ưu
            </span>{" "}
            Cho Công Trình
          </h1>

          <p className="text-zinc-600 dark:text-zinc-400 text-lg max-w-2xl mx-auto">
            Xem bảng giá chi tiết, tính toán hao hụt chính xác,nhận tư vấn báo
            giá tự động 24/7.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <Link to="/products">
              <Button
                size="lg"
                className="bg-orange-600 text-white hover:bg-orange-500 font-semibold shadow-lg shadow-orange-600/20 px-8 py-6 text-base"
              >
                Xem sản phẩm <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-zinc-200 text-zinc-650 hover:text-zinc-900 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:text-white dark:hover:bg-zinc-900 px-8 py-6 text-base"
              onClick={() => (window.location.href = "/products?chat=true")}
            >
              Hỏi Trợ Lý AI
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-white">
            Tính Năng Nổi Bật
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm max-w-xl mx-auto">
            Cung cấp nền tảng số hóa vật liệu xây dựng toàn diện cho chủ nhà và
            nhà thầu.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl glass-card glow-orange-hover">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-6">
              <Calculator className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
              Tính Toán Vật Tư Trực Quan
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Nhập diện tích xây dựng, AI sẽ tự động chọn kích thước, đề xuất số
              thùng gạch, lít sơn kèm theo hao hụt chi tiết.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl glass-card glow-orange-hover">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-6">
              <Bot className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
              Trích Xuất Báo Giá Bằng AI
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Chỉ cần nhập danh sách viết tay dạng thô, AI tự động tách số
              lượng, quy đổi đơn vị và khớp mã danh mục sản phẩm chính xác.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl glass-card glow-orange-hover">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-6">
              <Compass className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">
              Định Vị Giao Hàng Realtime(chưa có)
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Đơn hàng rời kho sẽ được gán xe tải, lái xe, định vị vị trí tọa độ
              GPS giả lập và thời gian dự kiến giao hàng trên bản đồ.
            </p>
          </div>
        </div>
      </section>

      {/* Category Navigation */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-8">
          Danh mục vật liệu
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl bg-zinc-100 dark:bg-zinc-900 animate-pulse border border-zinc-200 dark:border-zinc-800"
                />
              ))
            : categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?categoryId=${cat.id}`}
                  className="flex flex-col items-center justify-center p-6 rounded-xl border border-zinc-200 bg-white hover:border-orange-500/30 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/20 dark:hover:border-orange-500/30 dark:hover:bg-zinc-900/60 transition-all text-center group shadow-sm shadow-zinc-100/50 dark:shadow-none"
                >
                  <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors">
                    {cat.name}
                  </span>
                </Link>
              ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
              Sản phẩm tiêu biểu
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              Danh sách các vật tư phổ biến được nhiều công trình tin dùng.
            </p>
          </div>
          <Link
            to="/products"
            className="text-sm text-orange-500 hover:text-orange-400 flex items-center font-medium"
          >
            Tất cả sản phẩm <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <ProductGrid products={featuredProducts} loading={loading} />
      </section>
    </div>
  );
}
