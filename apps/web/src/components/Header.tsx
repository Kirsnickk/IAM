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
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shadow-sm">
      <div className="flex items-center space-x-4">
        <span className="text-slate-500 text-sm font-medium">Hệ thống Quản lý Tài sản Doanh nghiệp</span>
      </div>

      <div className="flex items-center space-x-6">
        <button className="relative text-slate-400 hover:text-slate-600 transition">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">3</span>
        </button>

        {user && (
          <div className="flex items-center space-x-3 border-l border-slate-200 pl-6">
            <div className="w-9 h-9 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center font-bold text-sm border border-sky-200">
              {user.fullName ? user.fullName.charAt(0) : 'U'}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-800 leading-tight">{user.fullName || 'Người dùng'}</p>
              <p className="text-xs text-sky-600 font-medium">{user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-4 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
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
