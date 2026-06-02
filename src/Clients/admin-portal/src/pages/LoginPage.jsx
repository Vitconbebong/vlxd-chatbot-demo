import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Vui lòng điền tài khoản và mật khẩu.");
      return;
    }

    const res = await login(email, password);
    if (res.success) {
      toast.success("Đăng nhập quản trị thành công!");
      navigate("/");
    } else {
      toast.error(res.error || "Tài khoản hoặc mật khẩu không đúng.");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/20 p-8 shadow-xl dark:shadow-2xl backdrop-blur-md">
        {/* Brand Title */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-orange-600/10 text-orange-500 border border-orange-500/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Hệ Thống Điều Hành
          </h2>
          <p className="text-xs text-zinc-500">
            Cổng thông tin quản lý cho ban quản trị và nhân viên kho bãi
          </p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Tài khoản nhân viên / Admin
            </label>
            <Input
              type="email"
              placeholder="sale@vlxd.local, admin@vlxd.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 rounded-lg text-sm h-11 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-600"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Mật khẩu
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-zinc-50 border-zinc-300 text-zinc-900 placeholder-zinc-400 focus-visible:ring-orange-500 rounded-lg text-sm h-11 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white dark:placeholder-zinc-600"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold shadow-lg shadow-orange-600/20 h-11 mt-6 transition-all"
          >
            {loading ? "Đang xử lý..." : "Đăng nhập hệ thống"}
          </Button>
        </form>

        {/* Seed Info block */}
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-905 p-4 space-y-2 text-[11px] text-zinc-500">
          <p className="font-bold text-zinc-700 dark:text-zinc-400">Tài khoản nhân sự mẫu:</p>
          <div className="grid grid-cols-2 gap-2 font-mono">
            <div>
              <p className="text-orange-600 dark:text-orange-500/80">Nhân viên Sales/Kho:</p>
              <p className="text-zinc-700 dark:text-zinc-400">sale@vlxd.local</p>
              <p className="text-zinc-600 dark:text-zinc-500">Sale@123</p>
            </div>
            <div>
              <p className="text-orange-600 dark:text-orange-500/80">Quản trị viên:</p>
              <p className="text-zinc-700 dark:text-zinc-400">admin@vlxd.local</p>
              <p className="text-zinc-600 dark:text-zinc-500">Admin@123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
