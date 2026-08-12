# KẾ HOẠCH TRIỂN KHAI WEB QUẢN LÝ TÀI SẢN DOANH NGHIỆP

> Tài liệu kế hoạch toàn diện: kiến trúc, công nghệ, phân pha, và chi tiết triển khai.

---

## 1. Mục tiêu dự án

Xây dựng hệ thống web quản lý toàn bộ vòng đời tài sản doanh nghiệp:

- Đăng ký, mã hoá, dán QR cho mỗi tài sản.
- Cấp phát, điều chuyển, thu hồi, thanh lý — mọi thao tác đều có phê duyệt và truy vết.
- Kiểm kê bằng quét QR trên điện thoại.
- Dashboard báo cáo giá trị, khấu hao, cảnh báo bảo hành/bảo trì.
- Phân quyền RBAC theo vai trò và phạm vi chi nhánh.
- Audit log bất biến cho mọi thay đổi.

---

## 2. Công nghệ đề xuất (Tech Stack)

### 2.1 Frontend

| Thành phần | Công nghệ | Lý do |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | SSR/SSG, routing, API routes, SEO |
| Ngôn ngữ | **TypeScript** | Type-safe, ít bug runtime |
| UI Library | **Shadcn/ui + Tailwind CSS** | Component đẹp, tuỳ biến cao, nhẹ |
| State | **TanStack Query (React Query)** | Cache server state, real-time sync |
| Form | **React Hook Form + Zod** | Validation mạnh, type-safe |
| Table | **TanStack Table** | Sort, filter, pagination phức tạp |
| Chart | **Recharts** | Dashboard biểu đồ tài sản |
| QR Code | **react-qr-code + html5-qrcode** | In QR và quét QR từ camera |
| Auth UI | **NextAuth.js** | OAuth, credentials, session |
| Date | **date-fns** | Xử lý ngày giờ nhẹ |
| Export | **xlsx + jspdf** | Xuất Excel/PDF |
| i18n | **next-intl** | Hỗ trợ Tiếng Việt + English |

### 2.2 Backend

| Thành phần | Công nghệ | Lý do |
|---|---|---|
| Runtime | **Node.js 20 LTS** | Ecosystem lớn, cùng ngôn ngữ FE |
| Framework | **Express.js** hoặc **tRPC** | REST truyền thống hoặc type-safe RPC |
| ORM | **Prisma** | Schema-first, migration, type generation |
| Database | **PostgreSQL 16** | JSONB, full-text search, quan hệ phức tạp |
| Cache | **Redis** | Session, queue, rate limit |
| Auth | **JWT + bcrypt** | Stateless auth, hash password |
| File Storage | **MinIO** hoặc **AWS S3** | Upload hóa đơn, hình ảnh, biên bản |
| Queue | **BullMQ** (Redis-backed) | Job: email, báo cáo, nhắc nhở |
| Email | **Nodemailer + SMTP** | Thông báo phê duyệt, cảnh báo |
| Validation | **Zod** | Schema validation chia sẻ FE/BE |
| API Docs | **Swagger/OpenAPI** | Tự động sinh docs API |

### 2.3 Infrastructure & DevOps

| Thành phần | Công nghệ | Lý do |
|---|---|---|
| Containerization | **Docker + Docker Compose** | Môi trường đồng nhất dev/prod |
| CI/CD | **GitHub Actions** | Build, test, deploy tự động |
| Hosting FE | **Vercel** hoặc **Docker/Nginx** | Deploy Next.js tối ưu |
| Hosting BE | **Railway** / **Render** / **VPS** | Backend + DB + Redis |
| Database | **Supabase** / **Neon** / **Self-host** | PostgreSQL managed |
| Monitoring | **Sentry** | Error tracking FE + BE |
| Logging | **Pino** | Structured logging JSON |
| SSL | **Let's Encrypt** / **Cloudflare** | HTTPS miễn phí |

### 2.4 Công cụ phát triển

| Thành phần | Công nghệ |
|---|---|
| Monorepo | **Turborepo** hoặc **pnpm workspaces** |
| Linter | **ESLint + Prettier** |
| Test | **Vitest** (unit) + **Playwright** (E2E) |
| Git | **Conventional Commits + Husky** |
| Editor | **VS Code + ESLint/Prettier extensions** |

---

## 3. Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────────┐ │
│  │ Desktop  │  │ Mobile   │  │ Tablet   │  │ QR Scanner App  │ │
│  │ Browser  │  │ Browser  │  │ Browser  │  │ (PWA Camera)    │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬─────────┘ │
└───────┼──────────────┼──────────────┼───────────────┼───────────┘
        │              │              │               │
        └──────────────┴──────┬───────┴───────────────┘
                              │ HTTPS
┌─────────────────────────────┴───────────────────────────────────┐
│                     FRONTEND — Next.js 14                       │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌──────────────┐  │
│  │ Pages    │  │ Layouts  │  │ Components │  │ API Routes   │  │
│  │ (App     │  │ (Sidebar │  │ (Shadcn/ui │  │ (Auth,       │  │
│  │  Router) │  │  Topbar) │  │  Tables)   │  │  Proxy)      │  │
│  └──────────┘  └──────────┘  └────────────┘  └──────────────┘  │
└─────────────────────────────┬───────────────────────────────────┘
                              │ REST / tRPC
┌─────────────────────────────┴───────────────────────────────────┐
│                     BACKEND — Express / tRPC                    │
│  ┌───────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  │ Auth      │  │ Asset    │  │ Workflow   │  │ Report       │  │
│  │ Module    │  │ Module   │  │ Engine     │  │ Module       │  │
│  │ (JWT,RBAC)│  │ (CRUD,   │  │ (Approval, │  │ (Dashboard,  │  │
│  │           │  │  QR,     │  │  Transfer,  │  │  Export,     │  │
│  │           │  │  Search) │  │  Inventory) │  │  Schedule)   │  │
│  └───────────┘  └──────────┘  └───────────┘  └──────────────┘  │
│  ┌───────────┐  ┌──────────┐  ┌───────────┐  ┌──────────────┐  │
│  │ Audit     │  │ File     │  │ Notify    │  │ Integration  │  │
│  │ Logger    │  │ Storage  │  │ Service   │  │ Module       │  │
│  │ (immutable│  │ (S3/     │  │ (Email,   │  │ (HR, Acct,   │  │
│  │  append)  │  │  MinIO)  │  │  in-app)  │  │  ERP)        │  │
│  └───────────┘  └──────────┘  └───────────┘  └──────────────┘  │
└──────┬──────────────┬───────────────┬───────────────┬───────────┘
       │              │               │               │
┌──────┴──────┐ ┌─────┴─────┐ ┌───────┴──────┐ ┌─────┴─────┐
│ PostgreSQL  │ │   Redis   │ │  S3 / MinIO  │ │  SMTP     │
│ (Data,      │ │ (Session, │ │ (Files,      │ │ (Email    │
│  Audit Log) │ │  Queue,   │ │  Images,     │ │  Notify)  │
│             │ │  Cache)   │ │  Documents)  │ │           │
└─────────────┘ └───────────┘ └──────────────┘ └───────────┘
```

---

## 4. Cấu trúc thư mục dự án (Monorepo)

```
asset-management/
├── apps/
│   ├── web/                          # Next.js frontend
│   │   ├── app/                      # App Router pages
│   │   │   ├── (auth)/               # Login, register, forgot
│   │   │   ├── (dashboard)/          # Layout có sidebar
│   │   │   │   ├── assets/           # Danh sách, chi tiết, tạo mới
│   │   │   │   ├── assignments/      # Cấp phát
│   │   │   │   ├── transfers/        # Điều chuyển
│   │   │   │   ├── maintenance/      # Bảo trì / sự cố
│   │   │   │   ├── inventory/        # Kiểm kê
│   │   │   │   ├── procurement/      # Mua sắm / PO
│   │   │   │   ├── disposal/         # Thanh lý
│   │   │   │   ├── reports/          # Báo cáo / dashboard
│   │   │   │   ├── settings/         # Cấu hình hệ thống
│   │   │   │   │   ├── organization/
│   │   │   │   │   ├── locations/
│   │   │   │   │   ├── departments/
│   │   │   │   │   ├── employees/
│   │   │   │   │   ├── users/
│   │   │   │   │   ├── categories/
│   │   │   │   │   ├── vendors/
│   │   │   │   │   └── warehouses/
│   │   │   │   └── audit-log/        # Lịch sử thay đổi
│   │   │   └── scanner/              # Trang quét QR (PWA)
│   │   ├── components/               # UI components
│   │   │   ├── ui/                   # Shadcn/ui base
│   │   │   ├── layout/              # Sidebar, Topbar, Breadcrumb
│   │   │   ├── assets/              # Asset-specific components
│   │   │   ├── forms/               # Form components
│   │   │   └── charts/              # Dashboard charts
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── lib/                     # Utilities, API client
│   │   ├── types/                   # TypeScript types
│   │   └── public/                  # Static files
│   │
│   └── api/                         # Express/tRPC backend
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/            # Login, JWT, RBAC middleware
│       │   │   ├── assets/          # Asset CRUD + search + QR
│       │   │   ├── assignments/     # Cấp phát / bàn giao
│       │   │   ├── transfers/       # Điều chuyển
│       │   │   ├── maintenance/     # Bảo trì / ticket
│       │   │   ├── inventory/       # Kiểm kê
│       │   │   ├── procurement/     # PO + vendor
│       │   │   ├── disposal/        # Thanh lý
│       │   │   ├── reports/         # Aggregate queries
│       │   │   ├── notifications/   # Email + in-app notify
│       │   │   ├── files/           # Upload / download
│       │   │   └── audit/           # Audit log
│       │   ├── middleware/          # Auth, error, rate-limit
│       │   ├── utils/              # Helpers
│       │   ├── jobs/               # BullMQ workers
│       │   └── app.ts              # Express app setup
│       ├── prisma/
│       │   ├── schema.prisma       # Database schema
│       │   ├── migrations/         # Prisma migrations
│       │   └── seed.ts             # Seed data
│       └── tests/                  # API tests
│
├── packages/
│   └── shared/                     # Shared types, validation, constants
│       ├── types/                  # Asset, User, Transfer interfaces
│       ├── validators/             # Zod schemas
│       └── constants/              # Status enums, role enums
│
├── docker-compose.yml              # PostgreSQL + Redis + MinIO + App
├── turbo.json                      # Turborepo config
├── package.json                    # Root workspace
├── .env.example                    # Environment template
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Lint + Test
│       └── deploy.yml              # Build + Deploy
└── docs/
    ├── api.md                      # API reference
    ├── database.md                 # Schema explanation
    └── deployment.md               # Deploy guide
```

---

## 5. Database Schema tóm tắt

Tham chiếu file `asset_management_erd.png` trong cùng folder.

### Bảng chính (23 bảng)

**Master Data (5 bảng):**
- `organizations` — công ty, chi nhánh
- `locations` — địa điểm, tầng, phòng
- `departments` — phòng ban
- `employees` — nhân viên
- `vendors` — nhà cung cấp

**Asset Core (3 bảng):**
- `asset_categories` — loại tài sản (laptop, bàn, xe...)
- `asset_models` — model cụ thể (Dell Latitude 3520...)
- `assets` — từng tài sản vật lý, mã unique + serial unique

**Giao dịch vòng đời (5 bảng):**
- `asset_assignments` — cấp phát cho nhân viên
- `asset_transfers` — điều chuyển giữa người/vị trí
- `stock_transactions` — nhập/xuất kho
- `purchase_orders` + `purchase_order_items` — đơn mua hàng

**Vận hành (4 bảng):**
- `maintenance_tickets` — yêu cầu sửa chữa, bảo trì
- `asset_warranties` — thông tin bảo hành
- `inventory_audits` + `inventory_audit_items` — kỳ kiểm kê
- `inventory_counts` + `inventory_count_items` — đếm kiểm kê

**Kiểm soát (4 bảng):**
- `users` — tài khoản đăng nhập, RBAC
- `disposal_requests` — yêu cầu thanh lý
- `attachments` — file đính kèm (đa hình)
- `audit_logs` — lịch sử thay đổi bất biến

**Hỗ trợ (2 bảng):**
- `warehouses` — kho vật lý
- `notifications` — thông báo in-app

---

## 6. Phân pha triển khai

### Phase 1 — MVP (4-6 tuần)

**Mục tiêu:** Hệ thống chạy được, thay thế Excel.

| Tuần | Nội dung | Output |
|---|---|---|
| 1 | Setup monorepo, DB, auth, seed data | Login hoạt động, DB có dữ liệu mẫu |
| 2 | CRUD Master data: organization, location, department, employee, vendor | Quản lý danh mục cơ bản |
| 3 | CRUD Asset: category, model, asset + tạo mã QR + tìm kiếm | Đăng ký và tra cứu tài sản |
| 4 | Cấp phát + điều chuyển + thu hồi | Quản lý ai đang giữ tài sản gì |
| 5 | Dashboard tổng quan + báo cáo cơ bản + xuất Excel | Thấy tổng quan tài sản |
| 6 | Test E2E, fix bugs, deploy lên staging | Staging chạy ổn |

**Deliverables Phase 1:**
- [x] Đăng nhập / phân quyền (Admin, Manager, User)
- [x] CRUD danh mục: tổ chức, vị trí, phòng ban, nhân viên, nhà cung cấp
- [x] CRUD tài sản: tạo, sửa, xoá mềm, tìm kiếm, lọc
- [x] Sinh mã tài sản tự động (VD: HCM-IT-LAP-0001)
- [x] In QR code cho từng tài sản
- [x] Cấp phát tài sản cho nhân viên
- [x] Điều chuyển tài sản giữa người/vị trí
- [x] Thu hồi tài sản
- [x] Dashboard: tổng tài sản, theo trạng thái, theo phòng ban
- [x] Xuất danh sách tài sản ra Excel

### Phase 2 — Mua sắm & Bảo trì (3-4 tuần)

| Tuần | Nội dung |
|---|---|
| 7 | Mua sắm: yêu cầu mua → phê duyệt → PO → nhập kho |
| 8 | Bảo trì: báo hỏng → tiếp nhận → xử lý → đóng ticket |
| 9 | Kho: quản lý warehouse, nhập/xuất, tồn kho |
| 10 | Workflow phê duyệt nhiều cấp (theo giá trị, phòng ban) |

**Deliverables Phase 2:**
- [x] Tạo yêu cầu mua sắm, đính kèm báo giá
- [x] Phê duyệt theo cấp (Trưởng BP → Tài chính → Ban GĐ)
- [x] Tạo PO, theo dõi trạng thái giao hàng
- [x] Nhập kho + nghiệm thu
- [x] Báo hỏng / yêu cầu sửa chữa
- [x] Quản lý ticket bảo trì: priority, assignee, chi phí
- [x] Lịch sử bảo trì theo tài sản
- [x] Quản lý kho: tồn kho, nhập/xuất

### Phase 3 — Kiểm kê & Thanh lý (2-3 tuần)

| Tuần | Nội dung |
|---|---|
| 11 | Kiểm kê: tạo kỳ, sinh danh sách, quét QR xác nhận |
| 12 | Thanh lý: đề xuất, phê duyệt, ghi giảm |
| 13 | Bảo hành + hợp đồng + cảnh báo hết hạn |

**Deliverables Phase 3:**
- [x] Tạo kỳ kiểm kê theo chi nhánh/phòng ban
- [x] Quét QR bằng camera điện thoại để xác nhận
- [x] Đối chiếu và xử lý chênh lệch
- [x] Đề xuất thanh lý + phê duyệt
- [x] Ghi nhận phương án xử lý và số tiền
- [x] Quản lý bảo hành, hợp đồng
- [x] Cảnh báo tự động: bảo hành sắp hết, bảo trì đến hạn

### Phase 4 — Nâng cao (2-4 tuần)

| Tuần | Nội dung |
|---|---|
| 14 | Khấu hao: tính tự động, báo cáo tài chính |
| 15 | Import dữ liệu từ Excel (migration tool) |
| 16 | Thông báo email/in-app, nhắc nhở tự động |
| 17 | PWA: quét QR offline, sync khi có mạng |

**Deliverables Phase 4:**
- [x] Khấu hao theo đường thẳng, giá trị còn lại
- [x] Import từ Excel: mapping cột, validate, preview
- [x] Email thông báo phê duyệt, cảnh báo
- [x] Thông báo in-app (bell icon)
- [x] PWA cho nhân viên kiểm kê

### Phase 5 — Tối ưu & Tích hợp (ongoing)

- Tích hợp HR (đồng bộ nhân viên nghỉ việc → trigger thu hồi)
- Tích hợp kế toán (khấu hao → phần mềm kế toán)
- SSO / Active Directory
- Báo cáo nâng cao: pivot table, trend
- API public cho đối tác
- Mobile app native (React Native) nếu cần

---

## 7. API Endpoints chính

### Auth
```
POST   /api/auth/login           # Đăng nhập
POST   /api/auth/logout          # Đăng xuất
GET    /api/auth/me              # Thông tin user hiện tại
POST   /api/auth/refresh         # Refresh token
```

### Assets
```
GET    /api/assets               # Danh sách (filter, sort, paginate)
GET    /api/assets/:id           # Chi tiết tài sản
POST   /api/assets               # Tạo mới
PATCH  /api/assets/:id           # Cập nhật
DELETE /api/assets/:id           # Xoá mềm
GET    /api/assets/:id/history   # Lịch sử thay đổi
GET    /api/assets/:id/qr        # Sinh QR code (PNG)
POST   /api/assets/import        # Import từ Excel
GET    /api/assets/export        # Xuất Excel
```

### Assignments
```
GET    /api/assignments                  # Danh sách cấp phát
POST   /api/assignments                  # Cấp phát tài sản
POST   /api/assignments/:id/return       # Thu hồi
GET    /api/employees/:id/assets         # Tài sản của nhân viên
```

### Transfers
```
GET    /api/transfers            # Danh sách điều chuyển
POST   /api/transfers            # Tạo phiếu điều chuyển
PATCH  /api/transfers/:id        # Phê duyệt / từ chối
POST   /api/transfers/:id/confirm # Bên nhận xác nhận
```

### Maintenance
```
GET    /api/maintenance          # Danh sách ticket
POST   /api/maintenance          # Tạo ticket bảo trì
PATCH  /api/maintenance/:id      # Cập nhật trạng thái
GET    /api/assets/:id/maintenance # Lịch sử bảo trì của tài sản
```

### Inventory
```
GET    /api/inventory/audits     # Danh sách kỳ kiểm kê
POST   /api/inventory/audits     # Tạo kỳ kiểm kê mới
POST   /api/inventory/scan       # Quét QR xác nhận tài sản
GET    /api/inventory/audits/:id/results # Kết quả kiểm kê
POST   /api/inventory/audits/:id/close   # Đóng kỳ kiểm kê
```

### Procurement
```
GET    /api/purchase-orders      # Danh sách PO
POST   /api/purchase-orders      # Tạo PO
PATCH  /api/purchase-orders/:id  # Cập nhật PO
POST   /api/purchase-orders/:id/receive # Nhận hàng
```

### Disposal
```
GET    /api/disposals            # Danh sách thanh lý
POST   /api/disposals            # Tạo yêu cầu thanh lý
PATCH  /api/disposals/:id        # Phê duyệt / từ chối
```

### Reports
```
GET    /api/reports/dashboard         # Tổng quan
GET    /api/reports/by-department     # Theo phòng ban
GET    /api/reports/by-category       # Theo loại tài sản
GET    /api/reports/depreciation      # Khấu hao
GET    /api/reports/expiring-warranty # Bảo hành sắp hết
GET    /api/reports/overdue-maintenance # Bảo trì quá hạn
```

### Master Data
```
GET|POST|PATCH|DELETE  /api/organizations
GET|POST|PATCH|DELETE  /api/locations
GET|POST|PATCH|DELETE  /api/departments
GET|POST|PATCH|DELETE  /api/employees
GET|POST|PATCH|DELETE  /api/vendors
GET|POST|PATCH|DELETE  /api/warehouses
GET|POST|PATCH|DELETE  /api/categories
GET|POST|PATCH|DELETE  /api/models
GET|POST|PATCH|DELETE  /api/users
```

### Audit
```
GET    /api/audit-logs           # Tra cứu lịch sử (filter by entity, user, date)
```

---

## 8. Phân quyền RBAC

### Ma trận quyền

| Module | Admin | Asset Mgr | Dept Mgr | IT Support | Finance | Procurement | Employee | Auditor |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Cấu hình hệ thống | ✅ | — | — | — | — | — | — | — |
| Quản lý user | ✅ | — | — | — | — | — | — | — |
| Quản lý tài sản | ✅ | ✅ | Xem PB | Xem IT | Xem | — | — | Xem |
| Cấp phát | ✅ | ✅ | Duyệt PB | — | — | — | — | Xem |
| Điều chuyển | ✅ | ✅ | Duyệt PB | — | — | — | — | Xem |
| Thu hồi | ✅ | ✅ | — | ✅ | — | — | — | Xem |
| Bảo trì | ✅ | ✅ | — | ✅ | — | — | Tạo ticket | Xem |
| Mua sắm | ✅ | — | Đề xuất | — | Duyệt | ✅ | Đề xuất | Xem |
| Kiểm kê | ✅ | ✅ | Tham gia | ✅ | — | — | — | Xem |
| Thanh lý | ✅ | ✅ | Đề xuất | — | Duyệt | — | — | Xem |
| Báo cáo | ✅ | ✅ | PB mình | — | Tài chính | — | — | ✅ |
| Audit log | ✅ | Xem | — | — | — | — | — | ✅ |

### Scoping theo chi nhánh

- Mỗi user có `scope_location_ids[]`: danh sách chi nhánh được phép thao tác.
- Admin: không giới hạn.
- Dept Manager: chỉ thấy tài sản phòng ban mình.
- Employee: chỉ thấy tài sản được cấp cho mình.

---

## 9. Key Features chi tiết

### 9.1 Sinh mã tài sản tự động

```
Format: {LOCATION_CODE}-{DEPT_CODE}-{CATEGORY_CODE}-{SEQ}

Ví dụ:
  HCM-IT-LAP-0001    → Laptop phòng IT ở HCM
  HN-MKT-MON-0003    → Màn hình phòng Marketing ở HN
  DN-OPS-PRN-0001    → Máy in phòng Vận hành ở Đà Nẵng

Sequence tự tăng, theo scope category + location.
```

### 9.2 QR Code

- Mỗi tài sản được gán QR chứa URL: `https://app.domain.com/assets/{asset_code}`
- Khi quét QR → mở trang chi tiết tài sản (responsive).
- In hàng loạt QR label (dùng template PDF label A4).
- Quét QR trong màn hình kiểm kê → tự động tick.

### 9.3 Workflow phê duyệt

```
Cấu hình approval rules theo:
- Loại yêu cầu: mua sắm, thanh lý, điều chuyển
- Giá trị: < 10M, 10-50M, > 50M
- Phòng ban
- Loại tài sản

Mỗi rule chỉ định danh sách approvers theo thứ tự.
Khi tất cả đã duyệt → chuyển sang bước tiếp theo.
Nếu 1 người từ chối → về lại người tạo.
```

### 9.4 Audit Log bất biến

```sql
-- Mọi thay đổi đều ghi log, không cho sửa/xoá log
INSERT INTO audit_logs (entity_type, entity_id, action, old_values, new_values, user_id, occurred_at)
VALUES ('asset', 'uuid-123', 'UPDATE',
  '{"status":"available","location_id":"loc-1"}',
  '{"status":"in_use","location_id":"loc-2"}',
  'user-456', NOW());

-- Table audit_logs: không có UPDATE/DELETE permission cho bất kỳ role nào
REVOKE UPDATE, DELETE ON audit_logs FROM PUBLIC;
```

---

## 10. Ước tính nguồn lực

### Team tối thiểu

| Vai trò | Số người | Ghi chú |
|---|:---:|---|
| Fullstack (Next.js + Express) | 2 | Lead + Senior |
| Frontend (UI/UX focus) | 1 | Giao diện, responsive |
| Backend (API + DB) | 1 | Schema, performance |
| QA / Tester | 1 | Manual + automation |
| DevOps (part-time) | 0.5 | CI/CD, infra |
| PM / BA | 1 | Requirements, UAT |
| **Tổng** | **~5-6** | |

### Nếu team nhỏ (1-2 người Fullstack)

- Dùng Next.js API Routes thay Express riêng.
- Dùng Supabase/Neon thay self-host PostgreSQL.
- Dùng Vercel + Railway để không cần DevOps.
- Phase 1 MVP: 6-8 tuần thay vì 4-6 tuần.
- Bỏ Phase 5 ban đầu, thêm sau.

### Chi phí hosting ước tính (tháng)

| Dịch vụ | Free tier | Production |
|---|---|---|
| Vercel (FE) | ✅ Free | $20/mo |
| Railway (BE) | $5/mo | $20/mo |
| Neon/Supabase (DB) | ✅ Free tier | $25/mo |
| MinIO/S3 (Files) | Self-host | $5-20/mo |
| Redis (Upstash) | ✅ Free tier | $10/mo |
| Domain + SSL | $12/year | $12/year |
| Sentry (Monitor) | ✅ Free tier | $26/mo |
| **Tổng** | **~$5/mo** | **~$100-120/mo** |

---

## 11. Rủi ro và biện pháp

| Rủi ro | Mức độ | Biện pháp |
|---|:---:|---|
| Data migration từ Excel sai sót | Cao | Preview + validate trước import, chạy pilot |
| User không quen hệ thống mới | Trung bình | Training + hướng dẫn sử dụng + UI đơn giản |
| Performance với dữ liệu lớn (>100K assets) | Trung bình | Index đúng, pagination, cache Redis |
| Mất dữ liệu | Cao | Backup tự động hàng ngày, point-in-time recovery |
| Security breach | Cao | RBAC nghiêm ngặt, HTTPS, SQL injection prevention, rate limit |
| Scope creep (làm nhiều hơn plan) | Trung bình | Stick to phases, MVP first, feature flag |
| Downtime khi deploy | Thấp | Blue-green deployment, health check |

---

## 12. Tiêu chí thành công

**Phase 1 thành công khi:**
1. Đăng nhập được với 3 role: Admin, Manager, Employee.
2. Tạo được tài sản mới với mã tự động và QR code.
3. Cấp phát tài sản cho nhân viên, xác nhận bàn giao.
4. Điều chuyển tài sản giữa phòng ban, có lịch sử.
5. Dashboard hiển thị tổng quan chính xác.
6. Xuất được danh sách tài sản ra Excel.
7. Audit log ghi nhận mọi thay đổi.
8. Tốc độ load trang < 2 giây.
9. Responsive trên mobile.

**Toàn dự án thành công khi:**
- Trả lời được 4 câu hỏi tại mọi thời điểm:
  1. Tài sản này là gì?
  2. Hiện đang ở đâu?
  3. Ai đang chịu trách nhiệm?
  4. Toàn bộ lịch sử đã diễn ra thế nào?

---

## 13. Bước tiếp theo

Sau khi duyệt kế hoạch này:

1. **Setup monorepo** — khởi tạo Turborepo + Next.js + Express + Prisma.
2. **Schema database** — viết `schema.prisma` đầy đủ, chạy migration.
3. **Auth module** — JWT + RBAC + seed data (admin, manager, user).
4. **CRUD tài sản** — bảng assets với sinh mã + QR.
5. **Triển khai Phase 1** — theo tuần như kế hoạch trên.

> Muốn bắt đầu Phase 1 ngay? Cho biết để khởi tạo project.

---

*Tài liệu này được tạo cùng với:*
- `asset_management_flow.png` — sơ đồ flow vòng đời tài sản
- `asset_management_erd.png` — ERD database schema
