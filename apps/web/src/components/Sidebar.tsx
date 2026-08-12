'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Box, UserCheck, ArrowRightLeft, Wrench, QrCode, BarChart3, ShieldAlert, Settings, Building2 } from 'lucide-react';

const menuItems = [
  { label: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Tài sản', href: '/assets', icon: Box },
  { label: 'Cấp phát', href: '/assignments', icon: UserCheck },
  { label: 'Điều chuyển', href: '/transfers', icon: ArrowRightLeft },
  { label: 'Bảo trì / Báo hỏng', href: '/maintenance', icon: Wrench },
  { label: 'Quét mã QR', href: '/scanner', icon: QrCode },
  { label: 'Báo cáo', href: '/reports', icon: BarChart3 },
  { label: 'Audit Log', href: '/audit-log', icon: ShieldAlert },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col border-r border-slate-800">
      <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
        <div className="bg-sky-600 text-white p-2 rounded-lg">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-white text-lg leading-tight">AssetMaster</h1>
          <p className="text-xs text-slate-400">Quản lý Tài sản Doanh nghiệp</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-sky-600 text-white' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
        v1.0.0 — Ready for Hosting
      </div>
    </aside>
  );
}
