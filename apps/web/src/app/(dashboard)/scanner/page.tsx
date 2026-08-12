'use client';
import { useState, useEffect } from 'react';
import { QrCode, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function ScannerPage() {
  const [manualCode, setManualCode] = useState('');
  const [assetResult, setAssetResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setAssetResult(null);

    try {
      const res = await api.get('/assets', { params: { search: code.trim() } });
      const found = res.data.assets?.find((a: any) => a.assetCode.toLowerCase() === code.trim().toLowerCase() || a.serialNumber?.toLowerCase() === code.trim().toLowerCase());
      if (found) {
        setAssetResult(found);
      } else {
        setError(`Không tìm thấy tài sản với mã: ${code}`);
      }
    } catch (e: any) {
      setError('Lỗi khi tra cứu tài sản');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex bg-sky-100 text-sky-700 p-3 rounded-full mb-2">
          <QrCode className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Quét & Tra cứu mã QR Tài sản</h1>
        <p className="text-slate-500 text-sm">Nhập mã tài sản hoặc dùng camera trên điện thoại để quét tem tài sản</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(manualCode); }} className="flex space-x-3">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Nhập mã QR/Asset Code (ví dụ: HCM-IT-LAP-0001)..."
            className="flex-1 px-4 py-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition shadow-sm"
          >
            {loading ? 'Đang tìm...' : 'Tra cứu'}
          </button>
        </form>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 text-center">
          💡 Gợi ý thử nghiệm: Nhập mã mẫu <span className="font-mono bg-white border px-1.5 py-0.5 rounded font-bold text-sky-700">HCM-IT-LAP-0001</span> hoặc <span className="font-mono bg-white border px-1.5 py-0.5 rounded font-bold text-sky-700">HN-IT-LAP-0001</span>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {assetResult && (
        <div className="bg-white p-6 rounded-2xl border border-sky-200 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase text-sky-600">Thông tin Tài sản Xác nhận</span>
              <h2 className="text-xl font-bold text-slate-900">{assetResult.name}</h2>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
              {assetResult.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">Mã tài sản</p>
              <p className="font-mono font-bold text-sky-700">{assetResult.assetCode}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">Serial Number</p>
              <p className="font-mono font-medium text-slate-800">{assetResult.serialNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">Vị trí hiện tại</p>
              <p className="font-medium text-slate-800">{assetResult.location?.name}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">Phòng ban</p>
              <p className="font-medium text-slate-800">{assetResult.department?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">Nguyên giá</p>
              <p className="font-bold text-slate-900">
                {assetResult.purchasePrice ? Number(assetResult.purchasePrice).toLocaleString('vi-VN') + ' VNĐ' : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
