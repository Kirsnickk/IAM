/**
 * Production-safe data import script
 * Imports cleaned data from Data clear/ to production Neon DB
 * Run with: DATABASE_URL=<neon-url> npx tsx src/prisma/import-to-production.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcryptModule from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import XLSX from 'xlsx';

const bcrypt = (bcryptModule as any).default || bcryptModule;
const prisma = new PrismaClient();

const DATA_CLEAR_DIR = path.resolve(process.cwd(), '../../Data clear');

async function main() {
  console.log('🚀 Starting production data import...');
  console.log(`📁 Data source: ${DATA_CLEAR_DIR}`);
  
  // Safety check: confirm we're on production DB
  const dbUrl = process.env.DATABASE_URL || '';
  if (!dbUrl.includes('neon') && !dbUrl.includes('morning-frog')) {
    console.error('❌ DATABASE_URL does not look like Neon production.');
    console.error('   Set DATABASE_URL to Neon connection string and retry.');
    process.exit(1);
  }

  console.log('✓ Target: Neon production database');
  
  // Check if data already exists
  const existingAssets = await prisma.asset.count();
  const existingEmployees = await prisma.employee.count();
  
  if (existingAssets > 0 || existingEmployees > 0) {
    console.warn(`⚠ Production DB already has data: ${existingAssets} assets, ${existingEmployees} employees`);
    console.warn('   This script is idempotent but will skip existing records.');
  }

  // Import using the same logic as import-data-clear.ts
  // (Re-use the helper functions)
  
  // Step 1: Create System Admin user
  const systemAdminEmail = 'system.admin@mapactive.vn';
  let sysAdmin = await prisma.user.findUnique({ where: { email: systemAdminEmail } });
  
  if (!sysAdmin) {
    const hashedPassword = await bcrypt.hash('Asset@2026', 10);
    sysAdmin = await prisma.user.create({
      data: {
        email: systemAdminEmail,
        passwordHash: hashedPassword,
        fullName: 'System Administrator',
        role: 'ADMIN',
        isActive: true,
      },
    });
    console.log('✓ Created System Admin user');
  } else {
    console.log('✓ System Admin already exists');
  }

  // Step 2: Import Organizations, Locations, Departments
  console.log('\n📋 Importing master data...');
  
  // Organization
  let mapactiveOrg = await prisma.organization.findFirst({ where: { code: 'MAPACTIVE' } });
  if (!mapactiveOrg) {
    mapactiveOrg = await prisma.organization.create({
      data: { code: 'MAPACTIVE', name: 'MapActive Vietnam', type: 'COMPANY' },
    });
  }

  // Locations (read from Store Master Checklist)
  const storeMasterFile = path.join(DATA_CLEAR_DIR, '04_Store_Master_Checklist_Firewall_Cleaned.xlsx');
  if (fs.existsSync(storeMasterFile)) {
    const wb = XLSX.readFile(storeMasterFile);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any>(ws);
    
    for (const row of rows) {
      const storeCode = String(row['Store Code'] || '').trim();
      const storeName = String(row['Store Name'] || '').trim();
      if (!storeCode || !storeName) continue;
      
      await prisma.location.upsert({
        where: { code: storeCode },
        create: {
          code: storeCode,
          name: storeName,
          type: 'STORE',
          organizationId: mapactiveOrg.id,
        },
        update: {},
      });
    }
    console.log(`✓ Imported ${rows.length} store locations`);
  }

  // Office locations
  await prisma.location.upsert({
    where: { code: 'HCM-HQ' },
    create: { code: 'HCM-HQ', name: 'MapActive HCM Office', type: 'OFFICE', organizationId: mapactiveOrg.id },
    update: {},
  });
  await prisma.location.upsert({
    where: { code: 'HN-OFFICE' },
    create: { code: 'HN-OFFICE', name: 'MapActive Hanoi Office', type: 'OFFICE', organizationId: mapactiveOrg.id },
    update: {},
  });

  // Departments (read from Employees file)
  const employeesFile = path.join(DATA_CLEAR_DIR, '01_Employees_Cleaned.xlsx');
  if (fs.existsSync(employeesFile)) {
    const wb = XLSX.readFile(employeesFile);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any>(ws);
    
    const uniqueDepts = [...new Set(rows.map(r => String(r['Department'] || '').trim()).filter(Boolean))];
    for (const deptName of uniqueDepts) {
      const deptCode = deptName.toUpperCase().replace(/\s+/g, '_');
      await prisma.department.upsert({
        where: { code: deptCode },
        create: { code: deptCode, name: deptName, organizationId: mapactiveOrg.id },
        update: {},
      });
    }
    console.log(`✓ Imported ${uniqueDepts.length} departments`);
  }

  // Step 3: Import Employees
  console.log('\n👥 Importing employees...');
  if (fs.existsSync(employeesFile)) {
    const wb = XLSX.readFile(employeesFile);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any>(ws);
    
    let empCount = 0;
    for (const row of rows) {
      const staffCode = String(row['Staff Code'] || '').trim();
      const fullName = String(row['Full Name'] || '').trim();
      const email = String(row['Email'] || '').trim();
      const deptName = String(row['Department'] || '').trim();
      
      if (!staffCode || !fullName) continue;
      
      const deptCode = deptName.toUpperCase().replace(/\s+/g, '_');
      const dept = await prisma.department.findUnique({ where: { code: deptCode } });
      
      const existing = await prisma.employee.findUnique({ where: { staffCode } });
      if (!existing) {
        const emp = await prisma.employee.create({
          data: {
            staffCode,
            fullName,
            email: email || `${staffCode.toLowerCase()}@mapactive.vn`,
            departmentId: dept?.id,
            organizationId: mapactiveOrg.id,
          },
        });
        
        // Create User account for Employee
        const userEmail = email || emp.email;
        const existingUser = await prisma.user.findUnique({ where: { email: userEmail } });
        if (!existingUser) {
          const defaultPassword = await bcrypt.hash('User@2026', 10);
          await prisma.user.create({
            data: {
              email: userEmail,
              passwordHash: defaultPassword,
              fullName,
              role: 'USER',
              isActive: true,
              employeeId: emp.id,
            },
          });
        }
        empCount++;
      }
    }
    console.log(`✓ Imported ${empCount} employees (skipped existing)`);
  }

  // Step 4: Import Assets (office + store)
  console.log('\n📦 Importing assets...');
  
  // Asset Categories
  const categoryMap: Record<string, string> = {
    'LAPTOP': 'Laptop',
    'PC': 'Desktop PC',
    'MONITOR': 'Monitor',
    'KEYBOARD': 'Keyboard',
    'MOUSE': 'Mouse',
    'HEADPHONE': 'Headphone',
    'PRINTER': 'Printer',
    'POS': 'POS Terminal',
    'NETWORK': 'Network Equipment',
    'BACKEND': 'Backend Server',
    'PDT': 'PDT Device',
  };
  
  for (const [code, name] of Object.entries(categoryMap)) {
    await prisma.assetCategory.upsert({
      where: { code },
      create: { code, name },
      update: {},
    });
  }

  // Import Office Assets
  const officeAssetsFile = path.join(DATA_CLEAR_DIR, '02_Office_Assets_Cleaned.xlsx');
  if (fs.existsSync(officeAssetsFile)) {
    const wb = XLSX.readFile(officeAssetsFile);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any>(ws);
    
    let assetCount = 0;
    for (const row of rows) {
      const assetId = String(row['Asset ID'] || '').trim();
      const sn = String(row['Serial Number'] || '').trim();
      const hwType = String(row['Hardware Type'] || '').trim();
      const statusRaw = String(row['Status'] || '').trim();
      
      if (!assetId) continue;
      
      const existing = await prisma.asset.findUnique({ where: { assetCode: assetId } });
      if (!existing) {
        const hcmOffice = await prisma.location.findUnique({ where: { code: 'HCM-HQ' } });
        const catCode = hwType.toUpperCase().includes('LAPTOP') ? 'LAPTOP' : 
                        hwType.toUpperCase().includes('PC') || hwType.toUpperCase().includes('DESKTOP') ? 'PC' :
                        hwType.toUpperCase().includes('MONITOR') ? 'MONITOR' : 'LAPTOP';
        const category = await prisma.assetCategory.findUnique({ where: { code: catCode } });
        
        const status = statusRaw.includes('Available') ? 'AVAILABLE' : 
                       statusRaw.includes('Use') ? 'IN_USE' : 'AVAILABLE';
        
        await prisma.asset.create({
          data: {
            assetCode: assetId,
            name: `${hwType} - ${assetId}`,
            serialNumber: sn || null,
            status,
            categoryId: category?.id,
            locationId: hcmOffice?.id,
          },
        });
        assetCount++;
      }
    }
    console.log(`✓ Imported ${assetCount} office assets`);
  }

  // Import Store Assets
  const storeAssetsFile = path.join(DATA_CLEAR_DIR, '03_Store_Assets_Audit_2026_Cleaned.xlsx');
  if (fs.existsSync(storeAssetsFile)) {
    const wb = XLSX.readFile(storeAssetsFile);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any>(ws);
    
    let storeAssetCount = 0;
    for (const row of rows) {
      const storeCode = String(row['Store Code'] || '').trim();
      const hwType = String(row['Hardware Type'] || '').trim();
      const categoryRaw = String(row['Category'] || '').trim();
      const sn = String(row['Serial Number'] || '').trim();
      
      if (!storeCode || !hwType) continue;
      
      const location = await prisma.location.findUnique({ where: { code: storeCode } });
      if (!location) continue;
      
      const catCode = categoryRaw.toUpperCase().includes('POS') ? 'POS' :
                      categoryRaw.toUpperCase().includes('NETWORK') ? 'NETWORK' :
                      categoryRaw.toUpperCase().includes('BACKEND') ? 'BACKEND' :
                      categoryRaw.toUpperCase().includes('PDT') ? 'PDT' : 'NETWORK';
      const category = await prisma.assetCategory.findUnique({ where: { code: catCode } });
      
      const generatedAssetCode = `${storeCode}-${catCode}-${sn.slice(-4) || Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;
      
      const existing = await prisma.asset.findUnique({ where: { assetCode: generatedAssetCode } });
      if (!existing) {
        await prisma.asset.create({
          data: {
            assetCode: generatedAssetCode,
            name: `${storeCode} - ${hwType}`,
            serialNumber: sn || null,
            status: 'IN_USE',
            categoryId: category?.id,
            locationId: location.id,
          },
        });
        storeAssetCount++;
      }
    }
    console.log(`✓ Imported ${storeAssetCount} store assets`);
  }

  // Final stats
  console.log('\n📊 Production import completed!');
  const finalAssets = await prisma.asset.count();
  const finalEmps = await prisma.employee.count();
  const finalLocs = await prisma.location.count();
  
  console.log(`✓ Total Assets: ${finalAssets}`);
  console.log(`✓ Total Employees: ${finalEmps}`);
  console.log(`✓ Total Locations: ${finalLocs}`);
  
  console.log('\n🎯 Next: Login at https://iam-api-sandy.vercel.app/login');
  console.log(`   Email: system.admin@mapactive.vn`);
  console.log(`   Password: Asset@2026`);
}

main()
  .catch((e) => {
    console.error('❌ Import failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
