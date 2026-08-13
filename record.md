# Asset Management Project — Session Record

## Mục tiêu
Tiếp tục phát triển hệ thống quản lý tài sản doanh nghiệp trong các phiên chat sau.

## Repository
- Local: `C:\Users\vandu\Documents\Asset_management`
- GitHub: `https://github.com/Kirsnickk/IAM`
- Branch chính: `main`
- Commit gần nhất đã deploy: `934cebb`

## Kiến trúc hiện tại
- Monorepo npm workspaces
- Backend: Express + TypeScript + Prisma
  - Thư mục: `apps/api`
  - Database: PostgreSQL trên Neon
  - Authentication: JWT + bcrypt
  - API modules: auth, assets, master data, assignments, transfers, maintenance, reports, audit
- Frontend: Next.js App Router + TypeScript + Tailwind
  - Thư mục: `apps/web`
  - Giao diện tiếng Việt
  - Các màn hình chính: login, dashboard, assets, assignments, transfers, maintenance, scanner, reports, audit log
- Shared package: `packages/shared`

## Hosting đã xác minh
### Neon
- Project: `morning-frog-89279242`
- Database: `neondb`
- Branch: `production`
- Trạng thái lần kiểm tra gần nhất: `All OK`
- Không lưu connection string/password trong file này.

### Render Backend
- Service ID: `srv-d9u2sdpt0dsc73ceftu0`
- Service: `IAM`
- URL: `https://iam-tfba.onrender.com`
- Health endpoint: `https://iam-tfba.onrender.com/health`
- Health check gần nhất: HTTP 200
- Login API đã xác minh thành công.
- Render Free có cold start/spin-down; request đầu tiên sau thời gian không hoạt động có thể chậm.

### Vercel Frontend
- Project: `iam-api`
- Team/account: `vanducminh31-archs-projects`
- Production domain: `https://iam-api-sandy.vercel.app`
- Deployment gần nhất: `iam-9o08y080x-vanducminh31-archs-projects.vercel.app`
- Status gần nhất: `Ready`
- Login page: `https://iam-api-sandy.vercel.app/login`

## Environment đã cấu hình
### Vercel
- `NEXT_PUBLIC_API_URL=https://iam-tfba.onrender.com/api/v1`
- Đã redeploy Production sau khi thêm biến.

### Render
- `DATABASE_URL`: lấy từ Neon, không ghi lại secret ở đây.
- `JWT_SECRET`: đã cấu hình trên Render.
- `NODE_ENV=production`
- `CORS_ORIGIN=https://iam-api-sandy.vercel.app`
- Đã rebuild/redeploy sau khi cập nhật environment.

## Tài khoản test
- Email: `admin@asset.vn`
- Password: `Admin@123`
- Chỉ dùng cho môi trường demo/test; cần đổi trước khi dùng production thực tế.

## Các kiểm tra đã thực hiện
- Backend local build: pass sau khi dừng các process Node đang khóa Prisma engine.
- Render `/health`: HTTP 200.
- Render `POST /api/v1/auth/login`: HTTP 200, trả JWT và user ADMIN.
- Render CORS preflight từ Vercel: HTTP 204.
- Vercel deployment: status `Ready`.
- Vercel `/login`: hiển thị giao diện đăng nhập.

## Việc cần làm tiếp theo
1. Kiểm tra login end-to-end trực tiếp trên trình duyệt bằng tài khoản admin.
2. Sửa các vấn đề UX/UI theo mockup Analytics Dashboard đã gửi:
   - Header tối màu.
   - Sidebar điều hướng.
   - KPI cards.
   - Biểu đồ và activity feed.
3. Hoàn thiện CRUD tài sản trên frontend: tạo, sửa, xóa mềm, lọc, phân trang.
4. Kiểm tra toàn bộ API production bằng token thật.
5. Bổ sung validation, loading state, empty state và error state.
6. Đổi JWT secret và mật khẩu admin trước khi dùng chính thức.
7. Tách migration/seed production an toàn hơn; tránh chạy seed destructive trong mỗi lần start.
8. Thêm custom domain nếu cần.

## Quy tắc khi tiếp tục
- Trước khi sửa code, đọc các file liên quan trong `C:\Users\vandu\Documents\Asset_management`.
- Sau mỗi thay đổi: chạy build/test phù hợp, commit và push lên GitHub.
- Không ghi secret Neon, JWT secret hoặc token vào Git/file record.
- Sau deploy phải kiểm tra bằng URL live, không chỉ dựa vào trạng thái dashboard.
- Nếu user nói “tiếp tục”, tự động tiếp tục từ mục “Việc cần làm tiếp theo”, không hỏi lại những thông tin đã có.

## Lệnh hữu ích
```bash
cd C:/Users/vandu/Documents/Asset_management
npm install
npm run build --workspace=packages/shared
npm run build --workspace=apps/api
npm run build --workspace=apps/web
npm run dev
curl https://iam-tfba.onrender.com/health
```

## Trạng thái phiên hiện tại
Deployment full-stack đã hoạt động:
- Neon: OK
- Render API: OK
- Vercel frontend: Ready
- Có thể bắt đầu vòng phát triển tiếp theo.
