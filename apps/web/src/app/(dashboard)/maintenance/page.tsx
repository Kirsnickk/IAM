'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Wrench, Plus, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function MaintenancePage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState({
    assetId: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    reportedById: '',
    estimatedCost: 0,
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/maintenance'),
      api.get('/assets'),
      api.get('/master/employees'),
    ]).then(([tRes, aRes, eRes]) => {
      setTickets(tRes.data.tickets || []);
      setAssets(aRes.data.assets || []);
      setEmployees(eRes.data.employees || []);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/maintenance', formData);
      setShowCreateModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Báo hỏng thất bại');
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/maintenance/${id}`, { status });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cập nhật thất bại');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Bảo trì & Báo hỏng Tài sản</h1>
          <p className="text-slate-500 text-sm">Theo dõi sự cố, ticket sửa chữa, chi phí và tiến độ bảo trì</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-4 py-2.5 rounded-lg text-sm flex items-center space-x-2 shadow-sm transition"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Báo hỏng / Sự cố mới</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
              <th className="p-4">Ticket No</th>
              <th className="p-4">Tài sản</th>
              <th className="p-4">Tiêu đề sự cố</th>
              <th className="p-4">Mức ưu tiên</th>
              <th className="p-4">Người báo</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 text-center">Cập nhật tiến độ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-slate-500">Đang tải...</td></tr>
            ) : tickets.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-slate-500">Chưa có ticket bảo trì nào</td></tr>
            ) : (
              tickets.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-mono font-semibold text-slate-700">{item.ticketNo}</td>
                  <td className="p-4">
                    <p className="font-medium text-slate-900">{item.asset?.name}</p>
                    <p className="text-xs font-mono text-sky-700">{item.asset?.assetCode}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-slate-800">{item.title}</p>
                    <p className="text-xs text-slate-500 truncate max-w-xs">{item.description}</p>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      item.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                      item.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {item.priority}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">{item.reportedBy?.fullName}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      item.status === 'OPEN' ? 'bg-red-100 text-red-800' :
                      item.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' :
                      item.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {item.status === 'OPEN' ? 'Mới tiếp nhận' :
                       item.status === 'IN_PROGRESS' ? 'Đang sửa chữa' :
                       item.status === 'RESOLVED' ? 'Đã hoàn thành' : item.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {item.status === 'OPEN' && (
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'IN_PROGRESS')}
                        className="px-3 py-1 bg-amber-600 text-white text-xs font-semibold rounded hover:bg-amber-700"
                      >
                        Bắt đầu sửa
                      </button>
                    )}
                    {item.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'RESOLVED')}
                        className="px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded hover:bg-emerald-700"
                      >
                        Hoàn thành
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Create Maintenance */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreate} className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Tạo Ticket Báo hỏng / Bảo trì</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Chọn tài sản bị sự cố</label>
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
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Người báo hỏng</label>
              <select
                value={formData.reportedById}
                onChange={(e) => setFormData({ ...formData, reportedById: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                required
              >
                <option value="">-- Chọn nhân viên --</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.fullName} ({e.department?.name})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Tiêu đề sự cố</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                placeholder="Laptop không lên nguồn / Màn hình sọc..."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Mô tả chi tiết</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                rows={3}
                required
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <button type="submit" className="flex-1 bg-rose-600 text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-rose-700">
                Gửi Ticket Bảo trì
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
