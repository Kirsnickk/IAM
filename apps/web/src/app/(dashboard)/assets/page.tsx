'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Box, Search, Plus, QrCode, Filter, FileSpreadsheet, Eye } from 'lucide-react';
import Link from 'next/link';

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [qrModalAsset, setQrModalAsset] = useState<any>(null);

  const fetchAssets = () => {
    setLoading(true);
    api.get('/assets', { params: { search } })
      .then((res) => setAssets(res.data.assets || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleShowQr = async (asset: any) => {
    try {
      const res = await api.get(`/assets/${asset.id}/qr`);
      setQrModalAsset({ ...asset, qrDataUrl: res.data.qrDataUrl });
    } catch (e) {
      alert('Không thể sinh QR code');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Danh sách Tài sản</h1>
          <p className="text-slate-500 text-sm">Đăng ký, dán mã QR, tìm kiếm và truy vết tài sản</p>
        </div>

        <div className="flex items-center space-x-3">
          <button className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-lg text-sm flex items-center space-x-2 border border-slate-300">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchAssets()}
            placeholder="Tìm theo Mã tài sản (HCM-IT-LAP-0001), Tên, Serial Number..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>
        <button
          onClick={fetchAssets}
          className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-6 py-2 rounded-lg text-sm transition"
        >
          Tìm kiếm
        </button>
      </div>

      {/* Assets Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
              <th className="p-4">Mã tài sản</th>
              <th className="p-4">Tên tài sản</th>
              <th className="p-4">Danh mục</th>
              <th className="p-4">Vị trí</th>
              <th className="p-4">Phòng ban</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4">Giá trị</th>
              <th className="p-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">Đang tải danh sách...</td>
              </tr>
            ) : assets.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">Không tìm thấy tài sản nào</td>
              </tr>
            ) : (
              assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-mono font-semibold text-sky-700">{asset.assetCode}</td>
                  <td className="p-4 font-medium text-slate-900">{asset.name}</td>
                  <td className="p-4 text-slate-600">{asset.category?.name}</td>
                  <td className="p-4 text-slate-600">{asset.location?.name}</td>
                  <td className="p-4 text-slate-600">{asset.department?.name || 'N/A'}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      asset.status === 'AVAILABLE' ? 'bg-emerald-100 text-emerald-800' :
                      asset.status === 'IN_USE' ? 'bg-sky-100 text-sky-800' :
                      asset.status === 'UNDER_MAINTENANCE' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {asset.status === 'AVAILABLE' ? 'Sẵn sàng' :
                       asset.status === 'IN_USE' ? 'Đang dùng' :
                       asset.status === 'UNDER_MAINTENANCE' ? 'Bảo trì' : asset.status}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-slate-900">
                    {asset.purchasePrice ? Number(asset.purchasePrice).toLocaleString('vi-VN') + ' đ' : 'N/A'}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleShowQr(asset)}
                        className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                        title="Xem QR Code"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* QR Modal */}
      {qrModalAsset && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">{qrModalAsset.name}</h3>
            <p className="text-sm font-mono text-sky-700 font-semibold">{qrModalAsset.assetCode}</p>
            {qrModalAsset.qrDataUrl && (
              <img src={qrModalAsset.qrDataUrl} alt="QR Code" className="w-48 h-48 mx-auto border p-2 rounded-lg" />
            )}
            <p className="text-xs text-slate-500">Dán tem QR code này lên thiết bị để kiểm kê và tra cứu</p>
            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-sky-600 text-white font-semibold py-2 rounded-lg text-sm hover:bg-sky-700"
              >
                In Tem QR
              </button>
              <button
                onClick={() => setQrModalAsset(null)}
                className="px-4 bg-slate-200 text-slate-700 font-semibold py-2 rounded-lg text-sm hover:bg-slate-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
