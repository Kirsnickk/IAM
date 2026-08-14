import { PrismaClient, AssetStatus, AssignmentStatus, MaintenanceStatus, MaintenancePriority, UserRole } from '@prisma/client';
import * as bcryptModule from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import * as xlsxModule from 'xlsx';

const xlsx = (xlsxModule as any).default || xlsxModule;
const bcrypt = (bcryptModule as any).default || bcryptModule;
const prisma = new PrismaClient();

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve Data clear folder for monorepo local dev and Render (rootDir=apps/api)
function resolveDataClearDir(): string {
  const candidates = [
    process.env.DATA_CLEAR_DIR,
    path.resolve(process.cwd(), 'Data clear'),
    path.resolve(process.cwd(), '../Data clear'),
    path.resolve(process.cwd(), '../../Data clear'),
    path.resolve(__dirname, '../../../../Data clear'),
    path.resolve('C:/Users/vandu/Documents/Asset_management/Data clear'),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Data clear folder not found. Checked: ${candidates.join(', ')}`
  );
}

const dataClearDir = resolveDataClearDir();

function readCsv(filePath: string): any[] {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ CSV File not found: ${filePath}`);
    return [];
  }
  const workbook = xlsx.readFile(filePath, { raw: true });
  const sheetName = workbook.SheetNames[0];
  return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
}

function readExcelSheet(filePath: string, sheetName: string): any[] {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Excel File not found: ${filePath}`);
    return [];
  }
  const workbook = xlsx.readFile(filePath, { raw: true });
  if (!workbook.Sheets[sheetName]) return [];
  return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
}

function slugifyCode(str: string): string {
  return str.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 30);
}

async function main() {
  console.log('🚀 Starting Data Clear Import Pipeline...');
  console.log(`📁 Source directory: ${dataClearDir}\n`);

  // 0. Base System Admin User for relations
  const defaultPasswordHash = await bcrypt.hash('Asset@2026', 10);
  const sysAdmin = await prisma.user.upsert({
    where: { email: 'system.admin@mapactive.vn' },
    update: {},
    create: {
      email: 'system.admin@mapactive.vn',
      passwordHash: defaultPasswordHash,
      fullName: 'System Data Import Admin',
      role: UserRole.ADMIN,
    },
  });

  // 1. Organization
  const org = await prisma.organization.upsert({
    where: { code: 'MAP-VN' },
    update: {},
    create: {
      name: 'MAP Active Vietnam',
      code: 'MAP-VN',
      address: 'VP HCM & Hệ thống Cửa hàng Toàn quốc',
      email: 'info@mapactive.vn',
    },
  });
  console.log(`✅ Organization created/verified: ${org.name} (${org.code})`);

  // 2. Locations (Offices & Stores)
  const locationsMap: Record<string, string> = {}; // Code -> ID

  // Default Office Locations
  const hcmLoc = await prisma.location.upsert({
    where: { code: 'HCM' },
    update: {},
    create: { name: 'HQ TP. Hồ Chí Minh', code: 'HCM', address: 'VP Hồ Chí Minh', organizationId: org.id },
  });
  locationsMap['HCM'] = hcmLoc.id;

  const hnLoc = await prisma.location.upsert({
    where: { code: 'HN' },
    update: {},
    create: { name: 'VP Hà Nội', code: 'HN', address: 'VP Hà Nội', organizationId: org.id },
  });
  locationsMap['HN'] = hnLoc.id;

  // Import Stores from 04_Store_Master_Checklist_Firewall_Cleaned.csv
  const storeMasterData = readCsv(path.join(dataClearDir, '04_Store_Master_Checklist_Firewall_Cleaned.csv'));
  for (const store of storeMasterData) {
    const storeCode = store['Store code'] || store['Storecode'];
    const storeName = store['Store name'] || `Store ${storeCode}`;
    if (!storeCode) continue;

    const loc = await prisma.location.upsert({
      where: { code: storeCode },
      update: {
        name: storeName,
        address: store['Address'] || storeName,
      },
      create: {
        code: storeCode,
        name: storeName,
        address: store['Address'] || storeName,
        organizationId: org.id,
      },
    });
    locationsMap[storeCode] = loc.id;
  }
  console.log(`✅ Locations created/updated: ${Object.keys(locationsMap).length} locations (Offices & Stores)`);

  // Warehouses
  const warehouseMap: Record<string, string> = {};
  const whDsv = await prisma.warehouse.upsert({
    where: { code: 'WH-DSV' },
    update: {},
    create: { name: 'Kho DSV', code: 'WH-DSV', locationId: hcmLoc.id, capacity: 1000 },
  });
  warehouseMap['DSV'] = whDsv.id;

  const whGeodis = await prisma.warehouse.upsert({
    where: { code: 'WH-GEODIS' },
    update: {},
    create: { name: 'Kho Geodis', code: 'WH-GEODIS', locationId: hcmLoc.id, capacity: 1000 },
  });
  warehouseMap['GEODIS'] = whGeodis.id;

  const whITStock = await prisma.warehouse.upsert({
    where: { code: 'WH-IT-STOCK' },
    update: {},
    create: { name: 'Kho IT Stock HQ', code: 'WH-IT-STOCK', locationId: hcmLoc.id, capacity: 500 },
  });
  warehouseMap['IT_STOCK'] = whITStock.id;

  // 3. Departments & Employees
  const departmentMap: Record<string, string> = {}; // Dept Name -> ID
  const employeeData = readCsv(path.join(dataClearDir, '01_Employees_Cleaned.csv'));

  // Collect unique departments
  const uniqueDepts = Array.from(new Set(employeeData.map((e) => e['Current Department']).filter(Boolean)));
  for (const deptName of uniqueDepts) {
    const deptCode = slugifyCode(deptName as string);
    const dept = await prisma.department.upsert({
      where: { code: deptCode },
      update: { name: deptName as string },
      create: {
        code: deptCode,
        name: deptName as string,
        organizationId: org.id,
      },
    });
    departmentMap[deptName as string] = dept.id;
  }
  console.log(`✅ Departments created/updated: ${Object.keys(departmentMap).length} departments`);

  // Upsert Employees & Users
  const employeeMap: Record<string, string> = {}; // StaffCode -> Employee ID
  for (const empRow of employeeData) {
    const staffCode = String(empRow['Employee Id']).trim();
    const fullName = String(empRow['Full Name']).trim();
    const email = empRow['Official Email Id'] ? String(empRow['Official Email Id']).trim() : `${staffCode.toLowerCase()}@mapactive.vn`;
    const deptName = empRow['Current Department'];
    const deptId = departmentMap[deptName] || Object.values(departmentMap)[0];

    // Create User account for employee
    const user = await prisma.user.upsert({
      where: { email },
      update: { fullName },
      create: {
        email,
        fullName,
        passwordHash: defaultPasswordHash,
        role: UserRole.EMPLOYEE,
      },
    });

    // Create Employee record
    const emp = await prisma.employee.upsert({
      where: { staffCode },
      update: {
        fullName,
        email,
        position: empRow['Current Designation'] || null,
        departmentId: deptId,
        userId: user.id,
      },
      create: {
        staffCode,
        fullName,
        email,
        position: empRow['Current Designation'] || null,
        departmentId: deptId,
        userId: user.id,
      },
    });
    employeeMap[staffCode] = emp.id;
  }
  console.log(`✅ Employees & User Accounts created/updated: ${Object.keys(employeeMap).length} employees`);

  // 4. Asset Categories & Asset Models
  const categoryMap: Record<string, string> = {}; // Cat Code -> ID
  const modelMap: Record<string, string> = {}; // Model Name -> ID

  const defaultCategories = [
    { name: 'Laptop / Computer', code: 'LAP', years: 3 },
    { name: 'POS Hardware', code: 'POS', years: 5 },
    { name: 'Network & Security', code: 'NET', years: 5 },
    { name: 'PDT Scanner', code: 'PDT', years: 3 },
    { name: 'Printers & Peripherals', code: 'PRN', years: 5 },
    { name: 'Monitors & Displays', code: 'MON', years: 5 },
    { name: 'Office Equipment', code: 'OFF', years: 5 },
  ];

  for (const cat of defaultCategories) {
    const c = await prisma.assetCategory.upsert({
      where: { code: cat.code },
      update: {},
      create: { name: cat.name, code: cat.code, depreciationYears: cat.years },
    });
    categoryMap[cat.code] = c.id;
  }

// Helper to resolve Category & Model
  async function getOrCreateModel(modelName: string, categoryCode: string, manufacturer?: string) {
    if (!modelName) modelName = 'Generic Hardware Model';
    const catId = categoryMap[categoryCode] || categoryMap['OFF'];
    if (modelMap[modelName]) return modelMap[modelName];

    const modelCode = slugifyCode(modelName);

    const model = await prisma.assetModel.upsert({
      where: { code: modelCode },
      update: { name: modelName },
      create: {
        name: modelName,
        code: modelCode,
        manufacturer: manufacturer || 'Standard Supplier',
        categoryId: catId,
      },
    });
    modelMap[modelName] = model.id;
    return model.id;
  }

  // 5. Office Assets (02_Office_Assets_Cleaned.csv)
  console.log('\n📦 Importing Office Assets...');
  const officeAssetsData = readCsv(path.join(dataClearDir, '02_Office_Assets_Cleaned.csv'));
  let officeAssetCount = 0;

  for (let i = 0; i < officeAssetsData.length; i++) {
    const row = officeAssetsData[i];
    const assetName = row['Asset Name'] || 'Office Asset';
    const assetId = row['Asset ID'] || `22VN0000${String(i + 1).padStart(4, '0')}`;
    const sn = row['S/N'] && String(row['S/N']).trim() !== 'nan' ? String(row['S/N']).trim() : null;
    const staffCode = row['Employee Id'] ? String(row['Employee Id']).trim() : null;
    const isAvailable = row['Status'] === 'Available' || !staffCode;

    const modelId = await getOrCreateModel(assetName, 'LAP', 'Dell/HP');

    const asset = await prisma.asset.upsert({
      where: { assetCode: assetId },
      update: {
        name: assetName,
        serialNumber: sn,
        status: isAvailable ? AssetStatus.AVAILABLE : AssetStatus.IN_USE,
        locationId: hcmLoc.id,
        notes: `CPU: ${row['CPU'] || 'N/A'}, RAM: ${row['RAM'] || 'N/A'}, Disk: ${row['Hard Disk'] || 'N/A'}, Hostname: ${row['Hostname'] || 'N/A'}`,
      },
      create: {
        assetCode: assetId,
        name: assetName,
        serialNumber: sn,
        status: isAvailable ? AssetStatus.AVAILABLE : AssetStatus.IN_USE,
        modelId,
        categoryId: categoryMap['LAP'],
        locationId: hcmLoc.id,
        notes: `CPU: ${row['CPU'] || 'N/A'}, RAM: ${row['RAM'] || 'N/A'}, Disk: ${row['Hard Disk'] || 'N/A'}, Hostname: ${row['Hostname'] || 'N/A'}`,
      },
    });

    // Create Assignment if assigned to Employee
    if (staffCode && employeeMap[staffCode] && !isAvailable) {
      const existingAssignment = await prisma.assetAssignment.findFirst({
        where: { assetId: asset.id, employeeId: employeeMap[staffCode], status: AssignmentStatus.ACTIVE },
      });
      if (!existingAssignment) {
        await prisma.assetAssignment.create({
          data: {
            assetId: asset.id,
            employeeId: employeeMap[staffCode],
            assignedById: sysAdmin.id,
            status: AssignmentStatus.ACTIVE,
            notes: 'Initial data clear import assignment',
          },
        });
      }
    }
    officeAssetCount++;
  }
  console.log(`✅ Office Assets imported: ${officeAssetCount} items`);

  // 6. Store Assets Audit 2026 (03_Store_Assets_Audit_2026_Cleaned.csv)
  console.log('\n🏬 Importing Store Assets (Audit 2026)...');
  const storeAssetsData = readCsv(path.join(dataClearDir, '03_Store_Assets_Audit_2026_Cleaned.csv'));
  let storeAssetCount = 0;

  for (let i = 0; i < storeAssetsData.length; i++) {
    const row = storeAssetsData[i];
    const storeCode = row['StoreCode'];
    const locId = locationsMap[storeCode] || hcmLoc.id;
    const catClean = (row['Category Cleaned'] || 'POS').toUpperCase();
    const hardwareType = row['Hardware Type Cleaned'] || row['Hardware Type'] || 'Equipment';
    const modelName = row['Model'] || hardwareType;
    const sn = row['SN_Clean'] && row['SN_Clean'] !== 'NAN' ? row['SN_Clean'] : null;

    let catCode = 'POS';
    if (catClean.includes('NET')) catCode = 'NET';
    else if (catClean.includes('PDT')) catCode = 'PDT';
    else if (catClean.includes('BACK')) catCode = 'LAP';

    const modelId = await getOrCreateModel(modelName, catCode);
    const generatedAssetCode = `${storeCode}-${catCode}-${String(i + 1).padStart(4, '0')}`;

    // If S/N is non-unique or shared across items (e.g. keyboards, mice), avoid S/N unique collision
    const existingBySN = sn ? await prisma.asset.findUnique({ where: { serialNumber: sn } }) : null;
    const safeSN = (sn && !existingBySN) ? sn : null;

    await prisma.asset.upsert({
      where: { assetCode: generatedAssetCode },
      update: {
        name: `${storeCode} - ${hardwareType}`,
        status: AssetStatus.IN_USE,
        locationId: locId,
        notes: row['Note'] ? `${row['Note']} | S/N raw: ${sn || 'N/A'}` : (sn && !safeSN ? `Duplicate S/N: ${sn}` : null),
      },
      create: {
        assetCode: generatedAssetCode,
        name: `${storeCode} - ${hardwareType}`,
        serialNumber: safeSN,
        status: AssetStatus.IN_USE,
        modelId,
        categoryId: categoryMap[catCode] || categoryMap['POS'],
        locationId: locId,
        notes: row['Note'] ? `${row['Note']} | S/N raw: ${sn || 'N/A'}` : (sn && !safeSN ? `Duplicate S/N: ${sn}` : null),
      },
    });
    storeAssetCount++;
  }
  console.log(`✅ Store Assets imported: ${storeAssetCount} items across 36 stores`);

  // 7. Broken & Maintenance Assets (05_Broken_and_Transfers_Cleaned.xlsx)
  console.log('\n🛠️ Importing Broken Assets & Maintenance Records...');
  const brokenData = readExcelSheet(path.join(dataClearDir, '05_Broken_and_Transfers_Cleaned.xlsx'), 'Office_Broken');
  let brokenCount = 0;

  for (let i = 0; i < brokenData.length; i++) {
    const row = brokenData[i];
    const assetName = row['Asset Name'] || 'Broken Asset';
    const assetCode = row['Asset ID'] || `BRK-OFF-${String(i + 1).padStart(3, '0')}`;
    const sn = row['S/N'] && String(row['S/N']).trim() !== 'nan' ? String(row['S/N']).trim() : null;

    const modelId = await getOrCreateModel(assetName, 'LAP');

    const asset = await prisma.asset.upsert({
      where: { assetCode },
      update: {
        status: AssetStatus.UNDER_MAINTENANCE,
        notes: row['Details'] || 'Broken asset reported in data clear',
      },
      create: {
        assetCode,
        name: assetName,
        serialNumber: sn,
        status: AssetStatus.UNDER_MAINTENANCE,
        modelId,
        categoryId: categoryMap['LAP'],
        locationId: hcmLoc.id,
        notes: row['Details'] || 'Broken asset reported in data clear',
      },
    });

    // Create Maintenance ticket (idempotent)
    const ticketNo = `TKT-BRK-${String(i + 1).padStart(3, '0')}`;
    const existingTicket = await prisma.maintenanceTicket.findUnique({ where: { ticketNo } });
    if (!existingTicket) {
      await prisma.maintenanceTicket.create({
        data: {
          ticketNo,
          assetId: asset.id,
          title: `Hư hỏng: ${assetName}`,
          description: row['Details'] || 'Cần kiểm tra phục hồi / thanh lý',
          priority: MaintenancePriority.HIGH,
          status: MaintenanceStatus.OPEN,
          reportedById: Object.values(employeeMap)[0] || sysAdmin.id,
        },
      });
    }
    brokenCount++;
  }
  console.log(`✅ Broken Assets & Maintenance tickets created: ${brokenCount} tickets`);

  console.log('\n======================================================');
  console.log('🎉 DATA CLEAR IMPORT COMPLETED SUCCESSFULLY!');
  console.log('======================================================\n');
}

if (process.argv.includes('--run') || process.env.AUTO_IMPORT === 'true' || process.argv[1]?.includes('import-data-clear')) {
  main()
    .catch((e) => {
      console.error('❌ Data Import Failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
