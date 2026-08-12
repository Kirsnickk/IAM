import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // 1. Users
  const adminHash = await bcrypt.hash('Admin@123', 10);
  const managerHash = await bcrypt.hash('Manager@123', 10);
  const userHash = await bcrypt.hash('User@123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@asset.vn' },
    update: {},
    create: { email: 'admin@asset.vn', passwordHash: adminHash, fullName: 'Admin Hệ Thống', role: 'ADMIN' },
  });
  const manager = await prisma.user.upsert({
    where: { email: 'manager@asset.vn' },
    update: {},
    create: { email: 'manager@asset.vn', passwordHash: managerHash, fullName: 'Nguyễn Văn Quản Lý', role: 'ASSET_MANAGER' },
  });
  const itUser = await prisma.user.upsert({
    where: { email: 'it@asset.vn' },
    update: {},
    create: { email: 'it@asset.vn', passwordHash: userHash, fullName: 'Trần IT Support', role: 'IT_SUPPORT' },
  });
  console.log('✅ Users created:', admin.email, manager.email, itUser.email);

  // 2. Organization
  const org = await prisma.organization.upsert({
    where: { code: 'CORP' },
    update: {},
    create: { name: 'Công ty TNHH ABC', code: 'CORP', address: '123 Nguyễn Huệ, Q.1, TP.HCM', email: 'info@abc.vn' },
  });

  // 3. Locations
  const locData = [
    { name: 'Trụ sở HCM', code: 'HCM', address: '123 Nguyễn Huệ, Q.1', organizationId: org.id },
    { name: 'Chi nhánh Hà Nội', code: 'HN', address: '456 Trần Duy Hưng, Cầu Giấy', organizationId: org.id },
    { name: 'Chi nhánh Đà Nẵng', code: 'DN', address: '789 Nguyễn Văn Linh, Hải Châu', organizationId: org.id },
  ];
  const locations: Record<string, any> = {};
  for (const loc of locData) {
    locations[loc.code] = await prisma.location.upsert({ where: { code: loc.code }, update: {}, create: loc });
  }
  console.log('✅ Locations:', Object.keys(locations).join(', '));

  // 4. Departments
  const deptData = [
    { name: 'Phòng IT', code: 'IT', organizationId: org.id },
    { name: 'Phòng Nhân sự', code: 'HR', organizationId: org.id },
    { name: 'Phòng Kế toán', code: 'FIN', organizationId: org.id },
    { name: 'Phòng Marketing', code: 'MKT', organizationId: org.id },
    { name: 'Phòng Kinh doanh', code: 'SALES', organizationId: org.id },
    { name: 'Phòng Vận hành', code: 'OPS', organizationId: org.id },
  ];
  const departments: Record<string, any> = {};
  for (const dept of deptData) {
    departments[dept.code] = await prisma.department.upsert({ where: { code: dept.code }, update: {}, create: dept });
  }
  console.log('✅ Departments:', Object.keys(departments).join(', '));

  // 5. Employees
  const empData = [
    { fullName: 'Lê Văn An', staffCode: 'NV001', email: 'an@abc.vn', position: 'IT Manager', departmentId: departments['IT'].id },
    { fullName: 'Phạm Thị Bình', staffCode: 'NV002', email: 'binh@abc.vn', position: 'Nhân viên IT', departmentId: departments['IT'].id },
    { fullName: 'Hoàng Văn Cường', staffCode: 'NV003', email: 'cuong@abc.vn', position: 'Kế toán trưởng', departmentId: departments['FIN'].id },
    { fullName: 'Nguyễn Thị Dung', staffCode: 'NV004', email: 'dung@abc.vn', position: 'HR Manager', departmentId: departments['HR'].id },
    { fullName: 'Trần Văn Em', staffCode: 'NV005', email: 'em@abc.vn', position: 'Marketing Executive', departmentId: departments['MKT'].id },
  ];
  for (const emp of empData) {
    await prisma.employee.upsert({ where: { staffCode: emp.staffCode }, update: {}, create: emp });
  }
  console.log('✅ Employees:', empData.length);

  // 6. Vendors
  const vendorData = [
    { name: 'FPT Services', code: 'VND-FPT', contactPerson: 'Trần FPT', email: 'sales@fpt.vn', taxCode: '0101234567' },
    { name: 'Dell Technologies', code: 'VND-DELL', contactPerson: 'Dell VN', email: 'sales@dell.vn', taxCode: '0102345678' },
    { name: 'Thế Giới Di Động', code: 'VND-TGDD', contactPerson: 'CS TGDD', email: 'b2b@tgdd.vn', taxCode: '0103456789' },
  ];
  for (const v of vendorData) {
    await prisma.vendor.upsert({ where: { code: v.code }, update: {}, create: v });
  }
  console.log('✅ Vendors:', vendorData.length);

  // 7. Asset Categories
  const catData = [
    { name: 'Laptop', code: 'LAP', depreciationYears: 3 },
    { name: 'Màn hình', code: 'MON', depreciationYears: 5 },
    { name: 'Máy in', code: 'PRN', depreciationYears: 5 },
    { name: 'Bàn ghế', code: 'FUR', depreciationYears: 8 },
    { name: 'Máy chủ', code: 'SRV', depreciationYears: 5 },
    { name: 'Thiết bị mạng', code: 'NET', depreciationYears: 5 },
    { name: 'Điện thoại', code: 'PHN', depreciationYears: 2 },
    { name: 'Máy chiếu', code: 'PRJ', depreciationYears: 5 },
  ];
  const categories: Record<string, any> = {};
  for (const cat of catData) {
    categories[cat.code] = await prisma.assetCategory.upsert({ where: { code: cat.code }, update: {}, create: cat });
  }
  console.log('✅ Categories:', Object.keys(categories).join(', '));

  // 8. Asset Models
  const modelData = [
    { name: 'Dell Latitude 3520', code: 'DELL-L3520', manufacturer: 'Dell', categoryId: categories['LAP'].id, specifications: { cpu: 'i5-1135G7', ram: '8GB', ssd: '256GB' } },
    { name: 'HP ProBook 450 G9', code: 'HP-PB450', manufacturer: 'HP', categoryId: categories['LAP'].id, specifications: { cpu: 'i7-1255U', ram: '16GB', ssd: '512GB' } },
    { name: 'Dell P2422H', code: 'DELL-P2422H', manufacturer: 'Dell', categoryId: categories['MON'].id, specifications: { size: '24"', resolution: 'FHD 1920x1080' } },
    { name: 'HP LaserJet Pro M404dn', code: 'HP-M404DN', manufacturer: 'HP', categoryId: categories['PRN'].id },
    { name: 'Dell PowerEdge R750', code: 'DELL-R750', manufacturer: 'Dell', categoryId: categories['SRV'].id },
    { name: 'Cisco Catalyst 9200L', code: 'CISCO-9200L', manufacturer: 'Cisco', categoryId: categories['NET'].id },
  ];
  const models: Record<string, any> = {};
  for (const m of modelData) {
    models[m.code] = await prisma.assetModel.upsert({ where: { code: m.code }, update: {}, create: m });
  }
  console.log('✅ Models:', Object.keys(models).join(', '));

  // 9. Sample Assets (20 tài sản mẫu)
  const assetsData = [
    { name: 'Laptop Dell An', assetCode: 'HCM-IT-LAP-0001', serialNumber: 'DELL-SN-001', modelId: models['DELL-L3520'].id, categoryId: categories['LAP'].id, locationId: locations['HCM'].id, departmentId: departments['IT'].id, purchasePrice: 15000000, purchaseDate: new Date('2024-01-15'), warrantyMonths: 36, status: 'IN_USE' as const },
    { name: 'Laptop HP Bình', assetCode: 'HCM-IT-LAP-0002', serialNumber: 'HP-SN-002', modelId: models['HP-PB450'].id, categoryId: categories['LAP'].id, locationId: locations['HCM'].id, departmentId: departments['IT'].id, purchasePrice: 22000000, purchaseDate: new Date('2024-02-10'), warrantyMonths: 24, status: 'IN_USE' as const },
    { name: 'Laptop Dell KT', assetCode: 'HCM-FIN-LAP-0001', serialNumber: 'DELL-SN-003', modelId: models['DELL-L3520'].id, categoryId: categories['LAP'].id, locationId: locations['HCM'].id, departmentId: departments['FIN'].id, purchasePrice: 15000000, purchaseDate: new Date('2024-03-01'), warrantyMonths: 36, status: 'AVAILABLE' as const },
    { name: 'Màn hình IT-1', assetCode: 'HCM-IT-MON-0001', serialNumber: 'DELL-MON-001', modelId: models['DELL-P2422H'].id, categoryId: categories['MON'].id, locationId: locations['HCM'].id, departmentId: departments['IT'].id, purchasePrice: 5500000, purchaseDate: new Date('2024-01-15'), warrantyMonths: 36, status: 'IN_USE' as const },
    { name: 'Màn hình IT-2', assetCode: 'HCM-IT-MON-0002', serialNumber: 'DELL-MON-002', modelId: models['DELL-P2422H'].id, categoryId: categories['MON'].id, locationId: locations['HCM'].id, departmentId: departments['IT'].id, purchasePrice: 5500000, purchaseDate: new Date('2024-02-10'), warrantyMonths: 36, status: 'IN_USE' as const },
    { name: 'Máy in Kế toán', assetCode: 'HCM-FIN-PRN-0001', serialNumber: 'HP-PRN-001', modelId: models['HP-M404DN'].id, categoryId: categories['PRN'].id, locationId: locations['HCM'].id, departmentId: departments['FIN'].id, purchasePrice: 8000000, purchaseDate: new Date('2023-06-15'), warrantyMonths: 12, status: 'AVAILABLE' as const },
    { name: 'Laptop HN IT', assetCode: 'HN-IT-LAP-0001', serialNumber: 'DELL-SN-010', modelId: models['DELL-L3520'].id, categoryId: categories['LAP'].id, locationId: locations['HN'].id, departmentId: departments['IT'].id, purchasePrice: 15000000, purchaseDate: new Date('2024-04-01'), warrantyMonths: 36, status: 'AVAILABLE' as const },
    { name: 'Laptop HN Sales-1', assetCode: 'HN-SALES-LAP-0001', serialNumber: 'HP-SN-010', modelId: models['HP-PB450'].id, categoryId: categories['LAP'].id, locationId: locations['HN'].id, departmentId: departments['SALES'].id, purchasePrice: 22000000, purchaseDate: new Date('2024-05-01'), warrantyMonths: 24, status: 'IN_USE' as const },
    { name: 'Switch mạng HCM', assetCode: 'HCM-IT-NET-0001', serialNumber: 'CISCO-001', modelId: models['CISCO-9200L'].id, categoryId: categories['NET'].id, locationId: locations['HCM'].id, departmentId: departments['IT'].id, purchasePrice: 45000000, purchaseDate: new Date('2023-12-01'), warrantyMonths: 60, status: 'IN_USE' as const },
    { name: 'Server HCM', assetCode: 'HCM-IT-SRV-0001', serialNumber: 'DELL-SRV-001', modelId: models['DELL-R750'].id, categoryId: categories['SRV'].id, locationId: locations['HCM'].id, departmentId: departments['IT'].id, purchasePrice: 120000000, purchaseDate: new Date('2023-09-01'), warrantyMonths: 60, status: 'IN_USE' as const },
  ];

  for (const a of assetsData) {
    await prisma.asset.upsert({
      where: { assetCode: a.assetCode },
      update: {},
      create: { ...a, currentValue: a.purchasePrice },
    });
  }
  console.log('✅ Assets:', assetsData.length);

  // 10. Warehouse
  await prisma.warehouse.upsert({
    where: { code: 'WH-HCM' },
    update: {},
    create: { name: 'Kho HCM', code: 'WH-HCM', locationId: locations['HCM'].id, capacity: 500 },
  });
  console.log('✅ Warehouse: WH-HCM');

  console.log('\n🎉 Seed hoàn tất!');
  console.log('📧 Admin login: admin@asset.vn / Admin@123');
  console.log('📧 Manager login: manager@asset.vn / Manager@123');
  console.log('📧 IT Support login: it@asset.vn / User@123');
}

seed()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
