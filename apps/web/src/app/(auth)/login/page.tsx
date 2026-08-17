'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Building2, Lock, Mail, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-200 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(2,132,199,0.03),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.02),transparent_50%)]"></div>
      
      <div className="relative w-full max-w-md">
        {/* Premium Doppelrand Login Card */}
        <div className="premium-card-outer scale-100 hover:scale-[1.01] transition-transform duration-500">
          <div className="premium-card-inner overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 text-white text-center p-8 -m-6 mb-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(2,132,199,0.15),transparent_70%)]"></div>
              <div className="relative">
                <div className="inline-flex bg-gradient-to-br from-brand-500 to-brand-600 p-3 rounded-2xl mb-4 ring-1 ring-white/10 shadow-xl">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <h1 className="text-[22px] font-bold tracking-tight">AssetMaster</h1>
                <p className="text-[11px] uppercase tracking-[0.08em] text-zinc-400 mt-1 font-bold">Enterprise IT Asset Management</p>
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-[13px] flex items-center space-x-2 ring-1 ring-rose-500/10">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="form-label">Email đăng nhập</label>
                <div className="relative">
                  <Mail className="w-[18px] h-[18px] absolute left-4 top-[13px] text-zinc-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input pl-11"
                    placeholder="admin@assetmaster.vn"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Mật khẩu</label>
                <div className="relative">
                  <Lock className="w-[18px] h-[18px] absolute left-4 top-[13px] text-zinc-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input pl-11"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-bold py-3.5 rounded-xl text-[13px] uppercase tracking-[0.05em] transition-all duration-300 shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed ring-1 ring-brand-500/20"
              >
                {loading ? 'Đang xác thực...' : 'Đăng nhập'}
              </button>

              <p className="text-center text-[11px] text-zinc-500 pt-2 tracking-wide">
                Liên hệ IT Admin nếu chưa có tài khoản truy cập
              </p>
            </form>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-[10px] uppercase tracking-wider text-zinc-400 mt-6 font-bold">
          Production Ready — Vercel Hosted
        </p>
      </div>
    </div>
  );
}
