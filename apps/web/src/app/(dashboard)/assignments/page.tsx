'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { UserCheck, Plus, CheckCircle, RotateCcw } from 'lucide-react';

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState({
    assetId: '',
    employeeId: '',
    notes: '',
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/assignments'),
      api.get('/assets', { params: { status: 'AVAILABLE' } }),
      api.get('/master/employees'),
    ]).then(([assignRes, assetRes, empRes]) => {
      setAssignments(assignRes.data.assignments || []);
      setAssets(assetRes.data.assets || []);
      setEmployees(empRes.data.employees || []);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/assignments', formData);
      setShowCreateModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Tạo phiếu cấp phát thất bại');
    }
  };

  const handleReturn = async (id: string) => {
    if (!confirm('Xác nhận thu hồi tài sản này về kho?')) return;
    try {
      await api.post(`/assignments/${id}/return`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Thu hồi thất bại');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý Cấp phát Tài sản</h1>
          <p className="text-slate-500 text-sm">Bàn giao tài sản cho nhân viên và thu hồi khi nghỉ việc/chuyển vị trí</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-4 py-2.5 rounded-lg text-sm flex items-center space-x-2 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Cấp phát mới</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
              <th className="p-4">Tài sản</th>
              <th className="p-4">Nhân viên tiếp nhận</th>
              <th className="p-4">Phòng ban</th>
              <th className="p-4">Ngày cấp phát</th>
              <th className="p-4">Người bàn giao</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-slate-500">Đang tải...</td></tr>
            ) : assignments.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-slate-500">Chưa có lịch sử cấp phát</td></tr>
            ) : (
              assignments.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="p-4">
                    <p className="font-semibold text-slate-900">{item.asset?.name}</p>
                    <p className="text-xs font-mono text-sky-700">{item.asset?.assetCode}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-slate-900">{item.employee?.fullName}</p>
                    <p className="text-xs text-slate-500">{item.employee?.staffCode}</p>
                  </td>
                  <td className="p-4 text-slate-600">{item.employee?.department?.name}</td>
                  <td className="p-4 text-slate-600">{new Date(item.assignedDate).toLocaleDateString('vi-VN')}</td>
                  <td className="p-4 text-slate-600">{item.assignedBy?.fullName}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      item.status === 'ACTIVE' ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.status === 'ACTIVE' ? 'Đang sử dụng' : 'Đã thu hồi'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {item.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleReturn(item.id)}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold border border-amber-200 transition"
                      >
                        Thu hồi
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal create assignment */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreate} className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Tạo Phiếu Cấp phát Tài sản</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Chọn tài sản có sẵn trong kho</label>
              <select
                value={formData.assetId}
                onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                required
              >
                <option value="">-- Chọn tài sản --</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>{a.assetCode} - {a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Chọn nhân viên bàn giao</label>
              <select
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                required
              >
                <option value="">-- Chọn nhân viên --</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.staffCode} - {e.fullName} ({e.department?.name})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Ghi chú bàn giao</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                rows={3}
                placeholder="Ví dụ: Bàn giao kèm sạc, túi chống sốc..."
              />
            </div>
            <div className="flex space-x-3 pt-2">
              <button type="submit" className="flex-1 bg-sky-600 text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-sky-700">
                Xác nhận Cấp phát
              </button>
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg text-sm hover:bg-slate-300">
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
