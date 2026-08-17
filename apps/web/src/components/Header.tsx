'use client';
import { useState, useEffect } from 'react';
import { Bell, LogOut } from 'lucide-react';

export function Header() {
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
    <header className="h-14 bg-[#0f1011]/80 backdrop-blur-xl border-b border-white/5 px-6 lg:px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center space-x-4">
        <span className="text-[11px] uppercase tracking-[0.08em] font-medium text-[#62666d]" style={{ fontWeight: 510 }}>Dashboard</span>
      </div>

      <div className="flex items-center space-x-3">
        <button className="relative p-2 text-[#8a8f98] hover:text-[#f7f8f8] hover:bg-white/5 rounded-lg transition-all duration-200">
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-0.5 right-0.5 bg-[#5e6ad2] text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-semibold">3</span>
        </button>

        {user && (
          <div className="flex items-center space-x-3 border-l border-white/5 pl-3">
            <div className="w-8 h-8 bg-[#5e6ad2] text-white rounded-full flex items-center justify-center font-semibold text-xs">
              {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-[13px] font-medium text-[#f7f8f8] leading-tight tracking-tight" style={{ fontWeight: 510 }}>{user.fullName || 'User'}</p>
              <p className="text-[10px] uppercase tracking-[0.05em] text-[#8a8f98] font-medium" style={{ fontWeight: 510 }}>{user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-[#8a8f98] hover:text-[#f7f8f8] hover:bg-white/5 rounded-lg transition-all duration-200"
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
