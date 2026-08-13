# 📋 PLAN VÀ QUY TRÌNH UPLOAD DỮ LIỆU SẠCH (DATA CLEAR) VÀO HỆ THỐNG ASSET MANAGEMENT

---

## 📌 1. TỔNG QUAN DỮ LIỆU ĐÃ LÀM SẠCH (DATA CLEAR)
Thư mục lưu trữ: `C:\Users\vandu\Documents\Asset_management\Data clear`

| STT | Tên file đã làm sạch | Loại dữ liệu | Số lượng bản ghi | Mục tiêu upload vào Hệ thống |
|---|---|---|---|---|
| **1** | `01_Employees_Cleaned.xlsx / .csv` | Nhân viên Office | 69 nhân viên | Bảng `employees` & Tự động tạo `User` account |
| **2** | `02_Office_Assets_Cleaned.xlsx / .csv` | Tài sản Văn phòng | 110 thiết bị | Bảng `assets` & `asset_assignments` |
| **3** | `03_Store_Assets_Audit_2026_Cleaned.xlsx / .csv` | Thiết bị Cửa hàng (Audit 2026) | 642 thiết bị (36 cửa hàng) | Bảng `assets`, `locations`, `asset_models`, `asset_categories` |
| **4** | `04_Store_Master_Checklist_Firewall_Cleaned.xlsx / .csv` | Danh mục Cửa hàng & Firewall | 33 cửa hàng & 31 Firewall IP | Bảng `locations`, metadata thông tin mạng / Firewall |
| **5** | `05_Broken_and_Transfers_Cleaned.xlsx` | Thiết bị hỏng & Chuyển giao | 15 thiết bị hỏng, 10 chuyển giao | Bảng `assets` (Status: UNDER_MAINTENANCE/DISPOSED), `asset_transfers` |
| **6** | `06_Transitions_and_Warehouse_Cleaned.xlsx` | Tồn kho & Kho vận (DSV/Geodis) | Stock IT, Kho DSV, Kho Geodis | Bảng `warehouses`, `stock_transactions`, `assets` (Status: AVAILABLE) |

---

## 🛠️ 2. QUY TRÌNH KĨ THUẬT UPLOAD VÀO HỆ THỐNG ASSET MANAGEMENT

Hệ thống `Asset_management` sử dụng **Node.js (Express) + Prisma ORM + PostgreSQL (NeonDB)**.
Để upload dữ liệu thành công mà không vi phạm ràng buộc khóa ngoại (Foreign Key Constraints), quá trình Seed/Import sẽ được thực hiện theo đúng **6 bước thứ tự (Topological Order)** dưới đây.

```
[Mức 1: Master Data] -> Organization, Locations, Departments, Vendors, Categories, Models
        ↓
[Mức 2: Identity]     -> Employees & Users
        ↓
[Mức 3: Core Assets]  -> Assets (Office assets, Store assets, Warehouse stock)
        ↓
[Mức 4: Lifecycle]    -> Asset Assignments (Phân công thiết bị cho Nhân viên / Cửa hàng)
        ↓
[Mức 5: Operations]   -> Asset Transfers (Chuyển giao), Maintenance/Broken Status
        ↓
[Mức 6: Audit]        -> Inventory Audit 2026 baseline & Warehouse Stock Transactions
```

---

## 🚀 3. PLAN THỰC THI CHI TIẾT (STEP-BY-STEP EXECUTION PLAN)

### 🔹 Giai đoạn 1: Chuẩn bị Script Import Tự động (Prisma Seed Extension)
1. **Viết Script ETL Node.js / TypeScript**:
   * Tạo script `apps/api/src/prisma/import-data-clear.ts` sử dụng `csv-parser` hoặc `xlsx` để đọc trực tiếp các file trong `Data clear`.
   * Chuẩn hóa mapping giữa Excel/CSV với Prisma Data Model.

2. **Quy tắc Mapping Chi tiết**:
   * **Organization**: Tạo mặc định Organization `MAP Active Vietnam` (`code: MAP-VN`).
   * **Locations**:
     * Office: HQ HCM, Office HN.
     * Stores: Mã cửa hàng từ `04_Store_Master_Checklist_Firewall_Cleaned.csv` (VA01, VA03, VO04, VN05, ...).
     * Warehouses: Kho DSV, Kho Geodis, Kho IT Stock HQ.
   * **Departments**: 14 phòng ban từ `01_Employees_Cleaned.csv` (Merchandising, IT, Finance Accounting, Operations, ...).
   * **Categories & Models**:
     * Phân loại tự động từ `Hardware Type` (`Mini Pc`, `Bill Printer`, `Access Point`, `Scanner`, `PDT`, `Laptop Dell Latitude`, ...).
   * **Employees**: StaffCode, FullName, Email, Department mapping.
   * **Assets & Asset Assignments**:
     * Mã Asset ID: Sử dụng Asset ID sẵn có (VD: `22VN00000001`) hoặc tự động gen theo chuẩn `STORECODE-CAT-000X`.
     * Gắn trạng thái `IN_USE` (nếu đang phân công nhân viên / cửa hàng), `AVAILABLE` (nếu ở kho), `UNDER_MAINTENANCE` (nếu đang hỏng).

---

### 🔹 Giai đoạn 2: Tạo API Endpoints Cho Phép Import Trực Tiếp Từ Web App (FE/BE Integration)
1. **Tạo API Endpoint**: `POST /api/v1/master/import-data-clear`
2. **Quyền Hạn**: Chỉ người dùng vai trò `ADMIN` hoặc `ASSET_MANAGER` mới được kích hoạt import.
3. **Log & Validation**: Kèm theo báo cáo chi tiết (Bản ghi hợp lệ, Bản ghi lỗi, Trùng lặp S/N).

---

### 🔹 Giai đoạn 3: Thực thi Import & Kiểm Tra Xác Nhận (Verification)
1. **Chạy Migration & Seed**:
   ```bash
   cd apps/api
   npx prisma db push
   npx ts-node src/prisma/import-data-clear.ts
   ```
2. **Đối soát số liệu sau khi Upload**:
   * Tổng số nhân viên trong DB = 69.
   * Tổng số thiết bị văn phòng = 110.
   * Tổng số thiết bị cửa hàng (Audit 2026) = 642.
   * Tổng số cửa hàng kích hoạt = 33 - 36.
3. **Kiểm tra Giao diện Dashboard Web**:
   * Mở Web UI tại `http://localhost:3000` (hoặc Vercel deployment `https://iam-api-sandy.vercel.app`).
   * Kiểm tra bộ lọc theo Location, Category, Employee và Trạng thái thiết bị.

---

## 📊 4. BÁO CÁO PHÂN TÍCH CHI TIẾT DỮ LIỆU ĐÃ LÀM SẠCH (DATA CLEAR ANALYTICS)

### 🏢 1. Nhân viên Văn phòng (Employees)
* **Tổng số nhân viên**: 69 người.
* **Phân bố theo Phòng ban lớn nhất**:
  1. Merchandising: 14 nhân viên (20.3%)
  2. Operations: 9 nhân viên (13.0%)
  3. Finance Accounting: 7 nhân viên (10.1%)
  4. Logistics & Marketing: 6 nhân viên mỗi phòng (8.7%)
  5. Information Technology: 3 nhân viên (4.3%)

### 💻 2. Tài sản Văn phòng (Office Assets)
* **Tổng số tài sản**: 110 thiết bị.
* **Trạng thái**:
  * `In Use` (Đang sử dụng): 68 thiết bị (61.8%) - Đã gắn đúng với Employee ID.
  * `Available` (Sẵn sàng trong kho): 32 thiết bị (29.1%).
* **Chất lượng dữ liệu**: 100 thiết bị có Serial Number (S/N) hợp lệ; 100% có Asset ID định danh.

### 🏪 3. Thiết bị Cửa hàng (Store Assets - Audit 2026 Baseline)
* **Tổng số hạng mục thiết bị**: 642 thiết bị quy mô toàn bộ **36 Cửa hàng**.
* **Phân loại theo Category**:
  * **POS** (Thiết bị bán hàng): 326 thiết bị (50.8%)
  * **NETWORK** (Thiết bị hạ tầng mạng): 120 thiết bị (18.7%)
  * **BACK-END** (Máy tính / Server văn phòng cửa hàng): 115 thiết bị (17.9%)
  * **PDT** (Máy kiểm kho cầm tay): 73 thiết bị (11.4%)
* **Top 5 loại phần cứng phổ biến nhất tại cửa hàng**:
  1. PDT (Máy kiểm kho): 54 thiết bị
  2. Monitor (Màn hình POS/Backend): 46 thiết bị
  3. Bill Printer (Máy in hóa đơn): 45 thiết bị
  4. Pole Display (Màn hình hiển thị giá): 40 thiết bị
  5. Access Point (Thiết bị Wifi UniFi/Aruba): 40 thiết bị
* **Chất lượng dữ liệu S/N**: 569 / 642 thiết bị (88.6%) có Serial Number chính xác để quản lý bảo hành và kiểm kê.

---

## 🎯 SUMMARY & NEXT STEPS
1. ✅ **Folder `Data clear` đã tạo thành công** tại: `C:\Users\vandu\Documents\Asset_management\Data clear`.
2. ✅ **Dữ liệu đã được phân tích, chuẩn hóa và xuất ra các file Excel + CSV sạch**.
3. 🔄 **Sẵn sàng thực thi Plan Upload** lên dự án `Asset_management` (Prisma/PostgreSQL).
