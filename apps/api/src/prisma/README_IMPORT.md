# Data Import Script for Asset Management System

Tự động import dữ liệu đã làm sạch từ `Data clear/` vào PostgreSQL database thông qua Prisma ORM.

## Cách sử dụng

```bash
cd apps/api
npx ts-node src/prisma/import-data-clear.ts
```

**⚠️ LƯU Ý**: Script này sẽ import dữ liệu vào database được định nghĩa trong `DATABASE_URL`. Đảm bảo bạn đang sử dụng đúng database (development/staging, KHÔNG PHẢI production) trước khi chạy.

## Dữ liệu được import

1. **Organizations & Locations**: Tạo organization MAP-VN và tất cả locations (offices + 36 stores)
2. **Departments**: 14 phòng ban từ dữ liệu nhân viên
3. **Asset Categories & Models**: Tự động phân loại từ Hardware Types
4. **Employees**: 69 nhân viên + tạo User accounts
5. **Assets**: 110 office assets + 642 store assets
6. **Asset Assignments**: Gắn assets cho employees và locations
7. **Maintenance Records**: Import broken assets và transfer records

## Thứ tự import (tuân thủ Foreign Key dependencies)

```
1. Master Data: Organization, Vendors
2. Locations: Offices, Stores, Warehouses  
3. Departments: 14 phòng ban
4. Categories & Models: Hardware classifications
5. Employees + Users: Staff accounts
6. Assets: Office + Store equipment
7. Assignments: Asset-Employee relationships
8. Lifecycle: Maintenance, Transfers
```

## Output

Script sẽ hiển thị progress logs và tổng kết số liệu import thành công.