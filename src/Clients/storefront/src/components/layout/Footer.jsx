import React from "react";
import { Mail, Phone, MapPin, Hammer } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 text-zinc-400 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xl font-bold text-orange-500">
              <Hammer className="h-6 w-6" />
              <span>
                VLXD<span className="text-white font-light">Smart</span>
              </span>
            </div>
            <p className="text-sm text-zinc-500">
              Hệ thống cung cấp vật liệu xây dựng thông minh, hỗ trợ tính toán
              vật tư và báo giá tự động bằng AI.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Sản phẩm nổi bật
            </h3>
            <ul className="space-y-2 text-sm">
              <li>Gạch lát sân vườn(demo)</li>
              <li>Xi măng Hà Tiên PCB40(demo)</li>
              <li>Thép thanh vằn Pomina(demo)</li>
              <li>Sơn chống thấm Dulux(demo)</li>
            </ul>
          </div>

          {/* Business Hours */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Giờ làm việc
            </h3>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li>Thứ 2 - Thứ 7: 7:00 - 18:00</li>
              <li>Chủ Nhật: 8:00 - 12:00</li>
              <li className="text-orange-500 font-medium">
                Hệ thống AI Chat hỗ trợ 24/7
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              Liên hệ
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-orange-500" />
                <span>Gia Bình, Bắc Ninh</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-orange-500" />
                <span>888 888 888</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-orange-500" />
                <span>support@vlxdsmart.vn</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-zinc-900 text-center text-xs text-zinc-600">
          <p>
            © {new Date().getFullYear()} VLXD Smart System. All rights reserved.
            Powered by vitconbebong.
          </p>
        </div>
      </div>
    </footer>
  );
}
