'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ShieldAlert, Clock, User } from 'lucide-react';

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/audit-logs')
      .then((res) => setLogs(res.data.logs || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nhật ký Hệ thống (Audit Log)</h1>
        <p className="text-slate-500 text-sm">Lịch sử truy vết bất biến toàn bộ thao tác thêm, sửa, xoá tài sản và phân quyền</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
              <th className="p-4">Thời gian</th>
              <th className="p-4">Thực thể (Entity)</th>
              <th className="p-4">Hành động</th>
              <th className="p-4">Người thực hiện</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-500">Đang tải audit log...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-500">Chưa có dữ liệu audit log</td></tr>
            ) : (
              logs.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-mono text-xs text-slate-500">{new Date(item.occurredAt).toLocaleString('vi-VN')}</td>
                  <td className="p-4 font-semibold text-slate-800 uppercase text-xs">{item.entityType}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                      item.action === 'CREATE' ? 'bg-emerald-100 text-emerald-800' :
                      item.action === 'UPDATE' ? 'bg-sky-100 text-sky-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {item.action}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-slate-900">{item.user?.fullName} ({item.user?.email})</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
