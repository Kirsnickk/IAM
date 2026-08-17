'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Box, UserCheck, ArrowRightLeft, Wrench, Building, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/reports/dashboard')
      .then((res) => setData(res.data.dashboard))
      .catch(() => setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-[11px] uppercase tracking-wider text-zinc-400 font-bold">Đang tải dữ liệu dashboard...</div>;
  }

  if (error) {
    return (
      <div className="premium-card-outer">
        <div className="premium-card-inner border border-rose-200 bg-rose-50">
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-bold text-zinc-900 tracking-tight">Dashboard Tổng quan</h1>
        <p className="text-[13px] text-zinc-500 mt-1">Thống kê toàn bộ vòng đời & trạng thái tài sản doanh nghiệp</p>
      </div>

      {/* Stats Cards - Premium Doppelrand Pattern */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="premium-card-outer hover:bg-zinc-900/[0.07] cursor-default">
          <div className="premium-card-inner flex items-center space-x-4">
            <div className="p-2.5 bg-gradient-to-br from-brand-500 to-brand-600 text-white rounded-xl ring-1 ring-brand-500/20">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-zinc-400">Tổng tài sản</p>
              <p className="text-[26px] font-bold text-zinc-900 tracking-tight leading-none mt-1">{data?.totalAssets || 0}</p>
            </div>
          </div>
        </div>

        <div className="premium-card-outer hover:bg-zinc-900/[0.07] cursor-default">
          <div className="premium-card-inner flex items-center space-x-4">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl ring-1 ring-emerald-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-zinc-400">Đang cấp phát</p>
              <p className="text-[26px] font-bold text-zinc-900 tracking-tight leading-none mt-1">
                {data?.byStatus?.find((s: any) => s.status === 'IN_USE')?.count || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="premium-card-outer hover:bg-zinc-900/[0.07] cursor-default">
          <div className="premium-card-inner flex items-center space-x-4">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl ring-1 ring-amber-500/20">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-zinc-400">Chờ điều chuyển</p>
              <p className="text-[26px] font-bold text-zinc-900 tracking-tight leading-none mt-1">{data?.pendingTransfers || 0}</p>
            </div>
          </div>
        </div>

        <div className="premium-card-outer hover:bg-zinc-900/[0.07] cursor-default">
          <div className="premium-card-inner flex items-center space-x-4">
            <div className="p-2.5 bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-xl ring-1 ring-rose-500/20">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-zinc-400">Đang bảo trì</p>
              <p className="text-[26px] font-bold text-zinc-900 tracking-tight leading-none mt-1">{data?.openMaintenanceTickets || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <div className="premium-card-outer">
          <div className="premium-card-inner">
            <h3 className="text-[13px] font-bold text-zinc-900 mb-5 uppercase tracking-[0.03em]">Tài sản theo Danh mục</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.byCategory || []}>
                  <XAxis dataKey="category" stroke="#a1a1aa" fontSize={11} />
                  <YAxis stroke="#a1a1aa" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0284c7" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Location breakdown */}
        <div className="premium-card-outer">
          <div className="premium-card-inner">
            <h3 className="text-[13px] font-bold text-zinc-900 mb-5 uppercase tracking-[0.03em]">Phân bổ theo Chi nhánh</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.byLocation || []}
                    dataKey="count"
                    nameKey="location"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {(data?.byLocation || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
