'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Box, UserCheck, ArrowRightLeft, Wrench, QrCode, BarChart3, ShieldAlert, Building2 } from 'lucide-react';

const menuItems = [
  { label: 'Tổng quan', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Tài sản', href: '/assets', icon: Box },
  { label: 'Cấp phát', href: '/assignments', icon: UserCheck },
  { label: 'Điều chuyển', href: '/transfers', icon: ArrowRightLeft },
  { label: 'Bảo trì', href: '/maintenance', icon: Wrench },
  { label: 'Quét QR', href: '/scanner', icon: QrCode },
  { label: 'Báo cáo', href: '/reports', icon: BarChart3 },
  { label: 'Audit', href: '/audit-log', icon: ShieldAlert },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#0f1011] text-[#d0d6e0] min-h-[100dvh] flex flex-col border-r border-white/5">
      <div className="p-6 border-b border-white/5 flex items-center space-x-3">
        <div className="bg-[#5e6ad2] text-white p-2 rounded-lg">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-semibold text-[#f7f8f8] text-[15px] tracking-tight" style={{ fontWeight: 510 }}>AssetMaster</h1>
          <p className="text-[10px] uppercase tracking-[0.08em] text-[#62666d] font-medium" style={{ fontWeight: 510 }}>IT Asset Mgmt</p>
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
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-[13px] font-medium tracking-tight transition-all duration-200 ${
                isActive 
                  ? 'bg-[#5e6ad2] text-white' 
                  : 'text-[#8a8f98] hover:bg-white/5 hover:text-[#f7f8f8]'
              }`}
              style={{ fontWeight: 510 }}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5 text-[10px] uppercase tracking-[0.08em] text-[#62666d] text-center font-medium" style={{ fontWeight: 510 }}>
        v1.0 Production
      </div>
    </aside>
  );
}
