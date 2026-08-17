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
    <aside className="w-64 bg-zinc-950 text-zinc-300 min-h-screen flex flex-col border-r border-zinc-900">
      <div className="p-6 border-b border-zinc-900 flex items-center space-x-3">
        <div className="bg-brand-600 text-white p-2 rounded-xl ring-1 ring-brand-500/20 shadow-sm">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-white text-[15px] tracking-tight">AssetMaster</h1>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Enterprise IAM</p>
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
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-[0.05em] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isActive 
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/10' 
                  : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-900 text-[10px] uppercase tracking-wider text-zinc-600 text-center font-bold">
        Production Ready
      </div>
    </aside>
  );
}
