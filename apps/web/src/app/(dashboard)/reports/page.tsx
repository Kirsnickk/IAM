'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { BarChart3, Building, DollarSign } from 'lucide-react';

export default function ReportsPage() {
  const [deptReport, setDeptReport] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/by-department')
      .then((res) => setDeptReport(res.data.report || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Báo cáo & Giá trị Khấu hao</h1>
        <p className="text-slate-500 text-sm">Thống kê giá trị tài sản, phân bổ theo phòng ban và giá trị còn lại</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="font-bold text-slate-900 text-lg">Báo cáo Giá trị Tài sản theo Phòng Ban</h3>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
              <th className="p-4">Phòng ban</th>
              <th className="p-4 text-center">Số lượng tài sản</th>
              <th className="p-4 text-right">Tổng Nguyên giá (VNĐ)</th>
              <th className="p-4 text-right">Giá trị Khấu hao hiện tại (VNĐ)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-500">Đang tải báo cáo...</td></tr>
            ) : deptReport.length === 0 ? (
              <tr><td colSpan={4} className="p-8 text-center text-slate-500">Chưa có dữ liệu</td></tr>
            ) : (
              deptReport.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-semibold text-slate-900">{item.department?.name || 'N/A'}</td>
                  <td className="p-4 text-center font-bold text-sky-700">{item.assetCount}</td>
                  <td className="p-4 text-right font-medium text-slate-900">
                    {item.totalPurchasePrice ? Number(item.totalPurchasePrice).toLocaleString('vi-VN') + ' đ' : '0 đ'}
                  </td>
                  <td className="p-4 text-right font-bold text-emerald-700">
                    {item.totalCurrentValue ? Number(item.totalCurrentValue).toLocaleString('vi-VN') + ' đ' : '0 đ'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
