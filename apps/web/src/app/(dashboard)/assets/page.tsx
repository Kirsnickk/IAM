'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import {
  Box,
  ChevronLeft,
  ChevronRight,
  Edit3,
  FileSpreadsheet,
  Loader2,
  Plus,
  QrCode,
  Search,
  Trash2,
  X,
} from 'lucide-react';

type Asset = {
  id: string;
  assetCode: string;
  name: string;
  serialNumber?: string | null;
  status: string;
  purchaseDate?: string | null;
  purchasePrice?: number | string | null;
  warrantyMonths?: number | null;
  specifications?: unknown;
  notes?: string | null;
  model?: { id: string; name: string; code?: string } | null;
  category?: { id: string; name: string; code?: string } | null;
  location?: { id: string; name: string; code?: string } | null;
  department?: { id: string; name: string; code?: string } | null;
  vendor?: { id: string; name: string } | null;
};

type Option = { id: string; name: string; code?: string };

type AssetForm = {
  name: string;
  serialNumber: string;
  modelId: string;
  categoryId: string;
  locationId: string;
  departmentId: string;
  vendorId: string;
  purchaseDate: string;
  purchasePrice: string;
  warrantyMonths: string;
  specifications: string;
  notes: string;
  status: string;
};

const PAGE_SIZE = 20;

const EMPTY_FORM: AssetForm = {
  name: '',
  serialNumber: '',
  modelId: '',
  categoryId: '',
  locationId: '',
  departmentId: '',
  vendorId: '',
  purchaseDate: '',
  purchasePrice: '',
  warrantyMonths: '',
  specifications: '',
  notes: '',
  status: 'AVAILABLE',
};

const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Sẵn sàng' },
  { value: 'IN_USE', label: 'Đang sử dụng' },
  { value: 'UNDER_MAINTENANCE', label: 'Bảo trì' },
  { value: 'RESERVED', label: 'Đã giữ chỗ' },
  { value: 'LOST', label: 'Mất' },
  { value: 'DISPOSED', label: 'Đã thanh lý' },
];

const STATUS_LABELS: Record<string, string> = Object.fromEntries(
  STATUS_OPTIONS.map((item) => [item.value, item.label]),
);

function getErrorMessage(error: any, fallback: string) {
  return error?.response?.data?.message || error?.message || fallback;
}

function formatMoney(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return '—';
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? `${numberValue.toLocaleString('vi-VN')} đ` : '—';
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('vi-VN');
}

function statusClass(status: string) {
  switch (status) {
    case 'AVAILABLE':
      return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/20';
    case 'IN_USE':
      return 'bg-brand-50 text-brand-700 ring-1 ring-brand-500/20';
    case 'UNDER_MAINTENANCE':
      return 'bg-amber-50 text-amber-700 ring-1 ring-amber-500/20';
    case 'LOST':
      return 'bg-rose-50 text-rose-700 ring-1 ring-rose-500/20';
    case 'DISPOSED':
      return 'bg-zinc-100 text-zinc-600 ring-1 ring-zinc-500/20';
    default:
      return 'bg-violet-50 text-violet-700 ring-1 ring-violet-500/20';
  }
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [models, setModels] = useState<Option[]>([]);
  const [locations, setLocations] = useState<Option[]>([]);
  const [departments, setDepartments] = useState<Option[]>([]);
  const [vendors, setVendors] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [masterLoading, setMasterLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [qrModalAsset, setQrModalAsset] = useState<(Asset & { qrDataUrl?: string; qrUrl?: string }) | null>(null);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [formData, setFormData] = useState<AssetForm>(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageSummary = useMemo(() => {
    if (total === 0) return '0 tài sản';
    const from = (page - 1) * PAGE_SIZE + 1;
    const to = Math.min(page * PAGE_SIZE, total);
    return `${from}–${to} / ${total} tài sản`;
  }, [page, total]);

  const fetchAssets = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/assets', {
        params: {
          page: page.toString(),
          limit: PAGE_SIZE.toString(),
          ...(appliedSearch && { search: appliedSearch }),
          ...(statusFilter && { status: statusFilter }),
          ...(categoryFilter && { categoryId: categoryFilter }),
          ...(locationFilter && { locationId: locationFilter }),
        },
      });
      setAssets(response.data.assets || []);
      setTotal(response.data.pagination?.total || 0);
    } catch (requestError: any) {
      setError(getErrorMessage(requestError, 'Không thể tải danh sách tài sản. Vui lòng thử lại.'));
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMasterData = async () => {
    setMasterLoading(true);
    try {
      const [categoryResponse, modelResponse, locationResponse, departmentResponse, vendorResponse] = await Promise.all([
        api.get('/master/categories'),
        api.get('/master/models'),
        api.get('/master/locations'),
        api.get('/master/departments'),
        api.get('/master/vendors'),
      ]);
      setCategories(categoryResponse.data.categories || []);
      setModels(modelResponse.data.models || []);
      setLocations(locationResponse.data.locations || []);
      setDepartments(departmentResponse.data.departments || []);
      setVendors(vendorResponse.data.vendors || []);
    } catch (requestError: any) {
      setError(getErrorMessage(requestError, 'Không thể tải dữ liệu danh mục dùng cho biểu mẫu.'));
    } finally {
      setMasterLoading(false);
    }
  };

  useEffect(() => {
    void fetchMasterData();
  }, []);

  useEffect(() => {
    void fetchAssets();
  }, [page, appliedSearch, statusFilter, categoryFilter, locationFilter]);

  const handleSearch = (event?: FormEvent) => {
    event?.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim());
  };

  const resetFilters = () => {
    setSearch('');
    setAppliedSearch('');
    setStatusFilter('');
    setCategoryFilter('');
    setLocationFilter('');
    setPage(1);
  };

  const openCreateModal = () => {
    setEditingAsset(null);
    setFormData(EMPTY_FORM);
    setFormError('');
    setFormModalOpen(true);
  };

  const openEditModal = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name || '',
      serialNumber: asset.serialNumber || '',
      modelId: asset.model?.id || '',
      categoryId: asset.category?.id || '',
      locationId: asset.location?.id || '',
      departmentId: asset.department?.id || '',
      vendorId: asset.vendor?.id || '',
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.slice(0, 10) : '',
      purchasePrice: asset.purchasePrice === null || asset.purchasePrice === undefined ? '' : String(asset.purchasePrice),
      warrantyMonths: asset.warrantyMonths === null || asset.warrantyMonths === undefined ? '' : String(asset.warrantyMonths),
      specifications: asset.specifications ? JSON.stringify(asset.specifications, null, 2) : '',
      notes: asset.notes || '',
      status: asset.status || 'AVAILABLE',
    });
    setFormError('');
    setFormModalOpen(true);
  };

  const closeFormModal = () => {
    if (!saving) setFormModalOpen(false);
  };

  const handleFormChange = (field: keyof AssetForm, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Vui lòng nhập tên tài sản.');
      return;
    }
    if (!formData.modelId || !formData.categoryId || !formData.locationId) {
      setFormError('Vui lòng chọn model, danh mục và vị trí cho tài sản.');
      return;
    }

    let specifications: unknown = null;
    if (formData.specifications.trim()) {
      try {
        specifications = JSON.parse(formData.specifications);
      } catch {
        setFormError('Thông số kỹ thuật phải là JSON hợp lệ, ví dụ: {"ram":"16GB"}.');
        return;
      }
    }

    const payload: Record<string, unknown> = {
      name: formData.name.trim(),
      serialNumber: formData.serialNumber.trim() || null,
      modelId: formData.modelId,
      categoryId: formData.categoryId,
      locationId: formData.locationId,
      departmentId: formData.departmentId || null,
      vendorId: formData.vendorId || null,
      purchaseDate: formData.purchaseDate ? new Date(`${formData.purchaseDate}T00:00:00`).toISOString() : null,
      purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : null,
      warrantyMonths: formData.warrantyMonths ? Number(formData.warrantyMonths) : null,
      specifications,
      notes: formData.notes.trim() || null,
    };

    if (formData.purchasePrice && (!Number.isFinite(Number(formData.purchasePrice)) || Number(formData.purchasePrice) < 0)) {
      setFormError('Giá mua phải là số không âm.');
      return;
    }
    if (formData.warrantyMonths && (!Number.isInteger(Number(formData.warrantyMonths)) || Number(formData.warrantyMonths) < 0)) {
      setFormError('Thời hạn bảo hành phải là số tháng nguyên không âm.');
      return;
    }

    if (editingAsset) payload.status = formData.status;

    setSaving(true);
    try {
      if (editingAsset) {
        await api.patch(`/assets/${editingAsset.id}`, payload);
        setNotice('Đã cập nhật tài sản.');
      } else {
        await api.post('/assets', payload);
        setNotice('Đã tạo tài sản mới.');
      }
      setFormModalOpen(false);
      await fetchAssets();
    } catch (requestError: any) {
      setFormError(getErrorMessage(requestError, editingAsset ? 'Cập nhật tài sản thất bại.' : 'Tạo tài sản thất bại.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (asset: Asset) => {
    if (!window.confirm(`Xác nhận xóa mềm tài sản “${asset.name}” (${asset.assetCode})?`)) return;
    setDeletingId(asset.id);
    setError('');
    try {
      await api.delete(`/assets/${asset.id}`);
      setNotice('Đã xóa mềm tài sản.');
      if (assets.length === 1 && page > 1) setPage((current) => current - 1);
      else await fetchAssets();
    } catch (requestError: any) {
      setError(getErrorMessage(requestError, 'Xóa tài sản thất bại.'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleShowQr = async (asset: Asset) => {
    try {
      const response = await api.get(`/assets/${asset.id}/qr`);
      setQrModalAsset({ ...asset, qrDataUrl: response.data.qrDataUrl, qrUrl: response.data.qrUrl });
    } catch (requestError: any) {
      setError(getErrorMessage(requestError, 'Không thể sinh QR code.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Box className="h-6 w-6 text-sky-600" />
            <h1 className="text-2xl font-bold text-slate-900">Danh sách Tài sản</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">Đăng ký, cập nhật, dán mã QR, tìm kiếm và truy vết tài sản</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={openCreateModal} className="flex items-center space-x-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700">
            <Plus className="h-4 w-4" />
            <span>Thêm tài sản</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label="Đóng thông báo"><X className="h-4 w-4" /></button>
        </div>
      )}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} aria-label="Đóng lỗi"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm mã tài sản, tên hoặc serial number..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <button type="submit" className="rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700">Tìm kiếm</button>
          <button type="button" onClick={resetFilters} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Xóa lọc</button>
        </form>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-sky-500">
            <option value="">Tất cả trạng thái</option>
            {STATUS_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
          <select value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-sky-500">
            <option value="">Tất cả danh mục</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <select value={locationFilter} onChange={(event) => { setLocationFilter(event.target.value); setPage(1); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:ring-2 focus:ring-sky-500">
            <option value="">Tất cả vị trí</option>
            {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-600">
                <th className="p-4">Mã tài sản</th>
                <th className="p-4">Tên tài sản</th>
                <th className="p-4">Danh mục / Model</th>
                <th className="p-4">Vị trí</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4">Giá trị</th>
                <th className="p-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr><td colSpan={7} className="p-10 text-center text-slate-500"><span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải danh sách...</span></td></tr>
              ) : assets.length === 0 ? (
                <tr><td colSpan={7} className="p-10 text-center text-slate-500">Không tìm thấy tài sản phù hợp.</td></tr>
              ) : assets.map((asset) => (
                <tr key={asset.id} className="transition hover:bg-slate-50">
                  <td className="p-4 font-mono font-semibold text-sky-700">{asset.assetCode}</td>
                  <td className="p-4">
                    <p className="font-medium text-slate-900">{asset.name}</p>
                    <p className="text-xs text-slate-500">Serial: {asset.serialNumber || '—'}</p>
                  </td>
                  <td className="p-4 text-slate-600">
                    <p>{asset.category?.name || '—'}</p>
                    <p className="text-xs text-slate-400">{asset.model?.name || 'Chưa có model'}</p>
                  </td>
                  <td className="p-4 text-slate-600">
                    <p>{asset.location?.name || '—'}</p>
                    <p className="text-xs text-slate-400">{asset.department?.name || 'Chưa phân phòng ban'}</p>
                  </td>
                  <td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(asset.status)}`}>{STATUS_LABELS[asset.status] || asset.status}</span></td>
                  <td className="p-4 font-medium text-slate-900">{formatMoney(asset.purchasePrice)}<p className="text-xs font-normal text-slate-400">{formatDate(asset.purchaseDate)}</p></td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1">
                      <button type="button" onClick={() => void handleShowQr(asset)} className="rounded-lg p-2 text-slate-500 hover:bg-sky-50 hover:text-sky-600" title="Xem QR Code"><QrCode className="h-4 w-4" /></button>
                      <button type="button" onClick={() => openEditModal(asset)} className="rounded-lg p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-600" title="Chỉnh sửa"><Edit3 className="h-4 w-4" /></button>
                      <button type="button" disabled={deletingId === asset.id} onClick={() => void handleDelete(asset)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50" title="Xóa mềm">
                        {deletingId === asset.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>{pageSummary}</span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> Trước</button>
            <span className="min-w-20 text-center">Trang {page} / {totalPages}</span>
            <button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Sau <ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>

      {formModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4">
          <form onSubmit={handleSave} className="my-8 max-h-[calc(100vh-4rem)] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between border-b border-slate-100 pb-4">
              <div><h2 className="text-xl font-bold text-slate-900">{editingAsset ? 'Chỉnh sửa tài sản' : 'Thêm tài sản mới'}</h2><p className="mt-1 text-sm text-slate-500">Các trường có dấu * là bắt buộc.</p></div>
              <button type="button" onClick={closeFormModal} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Đóng biểu mẫu"><X className="h-5 w-5" /></button>
            </div>
            {formError && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</div>}
            {masterLoading && <div className="mb-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">Đang tải danh mục biểu mẫu...</div>}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="md:col-span-2"><span className="form-label">Tên tài sản *</span><input value={formData.name} onChange={(event) => handleFormChange('name', event.target.value)} className="form-input" placeholder="Ví dụ: Laptop Dell Latitude 5440" required /></label>
              <label><span className="form-label">Serial Number</span><input value={formData.serialNumber} onChange={(event) => handleFormChange('serialNumber', event.target.value)} className="form-input" /></label>
              <label><span className="form-label">Model *</span><select value={formData.modelId} onChange={(event) => handleFormChange('modelId', event.target.value)} className="form-input" required><option value="">-- Chọn model --</option>{models.map((model) => <option key={model.id} value={model.id}>{model.name}{model.code ? ` (${model.code})` : ''}</option>)}</select></label>
              <label><span className="form-label">Danh mục *</span><select value={formData.categoryId} onChange={(event) => handleFormChange('categoryId', event.target.value)} className="form-input" required><option value="">-- Chọn danh mục --</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}{category.code ? ` (${category.code})` : ''}</option>)}</select></label>
              <label><span className="form-label">Vị trí *</span><select value={formData.locationId} onChange={(event) => handleFormChange('locationId', event.target.value)} className="form-input" required><option value="">-- Chọn vị trí --</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}{location.code ? ` (${location.code})` : ''}</option>)}</select></label>
              <label><span className="form-label">Phòng ban</span><select value={formData.departmentId} onChange={(event) => handleFormChange('departmentId', event.target.value)} className="form-input"><option value="">-- Chưa phân phòng ban --</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}{department.code ? ` (${department.code})` : ''}</option>)}</select></label>
              <label><span className="form-label">Nhà cung cấp</span><select value={formData.vendorId} onChange={(event) => handleFormChange('vendorId', event.target.value)} className="form-input"><option value="">-- Chưa chọn --</option>{vendors.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}</select></label>
              <label><span className="form-label">Ngày mua</span><input type="date" value={formData.purchaseDate} onChange={(event) => handleFormChange('purchaseDate', event.target.value)} className="form-input" /></label>
              <label><span className="form-label">Giá mua (VNĐ)</span><input type="number" min="0" step="1000" value={formData.purchasePrice} onChange={(event) => handleFormChange('purchasePrice', event.target.value)} className="form-input" /></label>
              <label><span className="form-label">Bảo hành (tháng)</span><input type="number" min="0" step="1" value={formData.warrantyMonths} onChange={(event) => handleFormChange('warrantyMonths', event.target.value)} className="form-input" /></label>
              {editingAsset && <label><span className="form-label">Trạng thái</span><select value={formData.status} onChange={(event) => handleFormChange('status', event.target.value)} className="form-input">{STATUS_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>}
              <label className="md:col-span-2"><span className="form-label">Thông số kỹ thuật (JSON, tùy chọn)</span><textarea value={formData.specifications} onChange={(event) => handleFormChange('specifications', event.target.value)} className="form-input font-mono text-xs" rows={3} placeholder={'{"ram":"16GB","storage":"512GB SSD"}'} /></label>
              <label className="md:col-span-2"><span className="form-label">Ghi chú</span><textarea value={formData.notes} onChange={(event) => handleFormChange('notes', event.target.value)} className="form-input" rows={3} /></label>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
              <button type="button" onClick={closeFormModal} className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200">Hủy</button>
              <button type="submit" disabled={saving || masterLoading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60">{saving && <Loader2 className="h-4 w-4 animate-spin" />}{saving ? 'Đang lưu...' : 'Lưu tài sản'}</button>
            </div>
          </form>
        </div>
      )}

      {qrModalAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="flex items-start justify-between"><div className="flex-1"><h3 className="text-lg font-bold text-slate-900">{qrModalAsset.name}</h3><p className="font-mono text-sm font-semibold text-sky-700">{qrModalAsset.assetCode}</p></div><button type="button" onClick={() => setQrModalAsset(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Đóng QR"><X className="h-5 w-5" /></button></div>
            {qrModalAsset.qrDataUrl && <img src={qrModalAsset.qrDataUrl} alt={`QR ${qrModalAsset.assetCode}`} className="mx-auto h-48 w-48 rounded-lg border p-2" />}
            <p className="text-xs text-slate-500">Dán tem QR này lên thiết bị để kiểm kê và tra cứu.</p>
            <div className="flex gap-3 pt-2"><button type="button" onClick={() => window.print()} className="flex-1 rounded-lg bg-sky-600 py-2 text-sm font-semibold text-white hover:bg-sky-700">In tem QR</button><button type="button" onClick={() => setQrModalAsset(null)} className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300">Đóng</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
