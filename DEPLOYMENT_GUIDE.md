# HƯỚNG DẪN HOẠT ĐỘNG & TRIỂN KHAI HOSTING DỰ ÁN ASSET MANAGEMENT

Dự án đã được build hoàn chỉnh thành monorepo chuẩn sản xuất với đầy đủ Backend Express (Prisma + PostgreSQL) và Frontend Next.js 14.

---

## 1. Cấu trúc Dự án
- `apps/api`: Backend Express API Node.js (Port 4000)
- `apps/web`: Frontend Next.js 14 (Port 3000)
- `packages/shared`: Data models, Validation schemas, Types chung
- `docker-compose.yml`: PostgreSQL 16 + Redis local

---

## 2. Hướng dẫn Chạy Local Môi trường Dev

### Bước 1: Khởi động Database PostgreSQL
```bash
docker-compose up -d
```

### Bước 2: Push Schema & Seed dữ liệu mẫu
```bash
npm run db:push --workspace=apps/api
npm run db:seed --workspace=apps/api
```

### Bước 3: Chạy đồng thời cả Frontend & Backend
```bash
npm run dev
```
- Frontend Web: `http://localhost:3000`
- Backend API: `http://localhost:4000`
- API Health Check: `http://localhost:4000/health`

Tài khoản truy cập mặc định:
- **Admin**: `admin@asset.vn` / `Admin@123`
- **Asset Manager**: `manager@asset.vn` / `Manager@123`
- **IT Support**: `it@asset.vn` / `User@123`

---

## 3. Hướng dẫn Deploy Hosting Cloud (Khuyên dùng: Render + Vercel)

### Option A: Hosting Tự động 1-Click (Free / Low Cost)

#### 1. Deploy Backend + Database lên Render.com
1. Đẩy repo mã nguồn lên GitHub.
2. Đăng nhập vào [Render.com](https://render.com).
3. Chọn **New +** → **Blueprint** → Chọn GitHub Repo vừa push.
4. Render sẽ đọc file `render.yaml` và tự động khởi tạo:
   - Managed PostgreSQL database.
   - Node.js Web service cho API, tự chạy `prisma db push` & `db:seed`.
5. Sao chép URL Backend API vừa sinh ra (VD: `https://asset-management-api.onrender.com`).

#### 2. Deploy Frontend lên Vercel.com
1. Đăng nhập [Vercel.com](https://vercel.com).
2. Chọn **Add New Project** → Import GitHub Repo.
3. Chọn Root Directory: `apps/web`.
4. Điền Environment Variable:
   - `NEXT_PUBLIC_API_URL` = `https://asset-management-api.onrender.com/api/v1`
5. Nhấn **Deploy**. Frontend sẽ online tại domain `.vercel.app`.

---

### Option B: Triển khai VPS / Self-hosted (Docker Compose)

Nếu bạn có máy chủ riêng (Ubuntu/Debian VPS):
1. SSH vào VPS và clone repo.
2. Tạo file `.env` với thông tin production.
3. Chạy lệnh:
```bash
docker-compose -f docker-compose.yml up --build -d
```
4. Cấu hình Nginx reverse proxy với HTTPS (Let's Encrypt).
