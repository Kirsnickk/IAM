'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, Bell } from 'lucide-react';

export function Header() {
  const router = RouterUser();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <header className="h-14 bg-white/80 backdrop-blur-xl border-b border-zinc-200/80 px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center space-x-4">
        <span className="text-[11px] uppercase tracking-[0.08em] font-bold text-zinc-400">IT Asset Management</span>
      </div>

      <div className="flex items-center space-x-4">
        <button className="relative p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-all duration-200">
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-1 right-1 bg-rose-500 text-white text-[9px] w-[14px] h-[14px] rounded-full flex items-center justify-center font-bold ring-2 ring-white">3</span>
        </button>

        {user && (
          <div className="flex items-center space-x-3 border-l border-zinc-200 pl-4">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-600 text-white rounded-full flex items-center justify-center font-bold text-xs ring-1 ring-brand-500/20">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-left">
              <p className="text-[13px] font-semibold text-zinc-900 leading-tight tracking-tight">{user.fullName || 'Người dùng'}</p>
              <p className="text-[10px] uppercase tracking-[0.05em] text-brand-600 font-bold">{user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-2 p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200"
              title="Đăng xuất"
            >
              <LogOut className="w-[16px] h-[16px]" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function RouterUser() {
  try {
    return useRouter();
  } catch {
    return null;
  }
}
