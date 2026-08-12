'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { ArrowRightLeft, Plus, Check, X } from 'lucide-react';

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [formData, setFormData] = useState({
    assetId: '',
    fromLocationId: '',
    toLocationId: '',
    fromDepartmentId: '',
    toDepartmentId: '',
    reason: '',
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/transfers'),
      api.get('/assets'),
      api.get('/master/locations'),
      api.get('/master/departments'),
    ]).then(([trRes, assRes, locRes, depRes]) => {
      setTransfers(trRes.data.transfers || []);
      setAssets(assRes.data.assets || []);
      setLocations(locRes.data.locations || []);
      setDepartments(depRes.data.departments || []);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssetSelect = (assetId: string) => {
    const selectedAsset = assets.find((a) => a.id === assetId);
    if (selectedAsset) {
      setFormData({
        ...formData,
        assetId,
        fromLocationId: selectedAsset.locationId || '',
        fromDepartmentId: selectedAsset.departmentId || '',
      });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/transfers', formData);
      setShowCreateModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Tạo phiếu thất bại');
    }
  };

  const handleApprove = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.patch(`/transfers/${id}`, { status });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Thao tác thất bại');
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await api.post(`/transfers/${id}/confirm`);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xác nhận tiếp nhận thất bại');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Điều chuyển Tài sản</h1>
          <p className="text-slate-500 text-sm">Điều chuyển tài sản giữa các chi nhánh, phòng ban có quy trình phê duyệt</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-4 py-2.5 rounded-lg text-sm flex items-center space-x-2 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Yêu cầu Điều chuyển</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
              <th className="p-4">Tài sản</th>
              <th className="p-4">Từ Chi nhánh/PB</th>
              <th className="p-4">Đến Chi nhánh/PB</th>
              <th className="p-4">Lý do</th>
              <th className="p-4">Người đề xuất</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 text-center">Phê duyệt & Xác nhận</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-slate-500">Đang tải...</td></tr>
            ) : transfers.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-slate-500">Chưa có yêu cầu điều chuyển nào</td></tr>
            ) : (
              transfers.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="p-4">
                    <p className="font-semibold text-slate-900">{item.asset?.name}</p>
                    <p className="text-xs font-mono text-sky-700">{item.asset?.assetCode}</p>
                  </td>
                  <td className="p-4 text-slate-600">
                    <p className="font-medium text-slate-800">{item.fromLocation?.name}</p>
                    <p className="text-xs text-slate-500">{item.fromDepartment?.name || 'Chưa gán'}</p>
                  </td>
                  <td className="p-4 text-slate-600">
                    <p className="font-medium text-sky-800">{item.toLocation?.name}</p>
                    <p className="text-xs text-slate-500">{item.toDepartment?.name || 'Chưa gán'}</p>
                  </td>
                  <td className="p-4 text-slate-700 max-w-xs truncate">{item.reason}</td>
                  <td className="p-4 text-slate-600">{item.requestedBy?.fullName}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      item.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                      item.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' :
                      item.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.status === 'PENDING' ? 'Chờ duyệt' :
                       item.status === 'APPROVED' ? 'Đã duyệt (Chờ nhận)' :
                       item.status === 'COMPLETED' ? 'Hoàn thành' : 'Từ chối'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    {item.status === 'PENDING' && (
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() => handleApprove(item.id, 'APPROVED')}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700"
                        >
                          Duyệt
                        </button>
                        <button
                          onClick={() => handleApprove(item.id, 'REJECTED')}
                          className="px-2.5 py-1 bg-rose-600 text-white rounded text-xs font-semibold hover:bg-rose-700"
                        >
                          Từ chối
                        </button>
                      </div>
                    )}
                    {item.status === 'APPROVED' && (
                      <button
                        onClick={() => handleConfirm(item.id)}
                        className="px-3 py-1 bg-sky-600 text-white rounded text-xs font-semibold hover:bg-sky-700"
                      >
                        Xác nhận đã nhận hàng
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Create Transfer */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreate} className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Yêu cầu Điều chuyển Tài sản</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Chọn tài sản cần điều chuyển</label>
              <select
                value={formData.assetId}
                onChange={(e) => handleAssetSelect(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                required
              >
                <option value="">-- Chọn tài sản --</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>{a.assetCode} - {a.name} ({a.location?.name})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Đến Chi nhánh</label>
                <select
                  value={formData.toLocationId}
                  onChange={(e) => setFormData({ ...formData, toLocationId: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                  required
                >
                  <option value="">-- Chọn chi nhánh đích --</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Đến Phòng ban</label>
                <select
                  value={formData.toDepartmentId}
                  onChange={(e) => setFormData({ ...formData, toDepartmentId: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                >
                  <option value="">-- Chọn phòng ban --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Lý do điều chuyển</label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm"
                rows={3}
                placeholder="Điều chuyển hỗ trợ dự án mới tại chi nhánh HN..."
                required
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <button type="submit" className="flex-1 bg-sky-600 text-white font-semibold py-2.5 rounded-lg text-sm hover:bg-sky-700">
                Gửi Yêu cầu Phê duyệt
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
