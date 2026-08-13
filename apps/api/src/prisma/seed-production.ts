import { PrismaClient, AssetStatus, UserRole } from '@prisma/client';
import * as bcryptModule from 'bcryptjs';

const bcrypt = (bcryptModule as any).default || bcryptModule;
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding production database...');

  // Check if already seeded
  const existingAdmin = await prisma.user.findUnique({ where: { email: 'system.admin@mapactive.vn' } });
  if (existingAdmin) {
    console.log('✓ Database already seeded. Skipping.');
    return;
  }

  // 1. Organization
  const org = await prisma.organization.create({
    data: { code: 'MAPACTIVE', name: 'MapActive Vietnam', type: 'COMPANY' },
  });

  // 2. Locations
  const hcmOffice = await prisma.location.create({
    data: { code: 'HCM-HQ', name: 'MapActive HCM Office', type: 'OFFICE', organizationId: org.id },
  });

  const hnOffice = await prisma.location.create({
    data: { code: 'HN-OFFICE', name: 'MapActive Hanoi Office', type: 'OFFICE', organizationId: org.id },
  });

  // Create 34 store locations
  const stores = [];
  for (let i = 1; i <= 34; i++) {
    const storeCode = `STORE-${String(i).padStart(3, '0')}`;
    const store = await prisma.location.create({
      data: {
        code: storeCode,
        name: `MapActive Store ${i}`,
        type: 'STORE',
        organizationId: org.id,
        address: `123 Street ${i}, Ho Chi Minh City`,
      },
    });
    stores.push(store);
  }

  // 3. Departments
  const deptData = [
    { code: 'IT', name: 'IT Department' },
    { code: 'FINANCE', name: 'Finance' },
    { code: 'OPERATIONS', name: 'Operations' },
    { code: 'MERCHANDISING', name: 'Merchandising' },
    { code: 'MARKETING', name: 'Marketing' },
    { code: 'LOGISTICS', name: 'Logistics' },
    { code: 'HR', name: 'Human Resources' },
  ];

  const departments = [];
  for (const d of deptData) {
    const dept = await prisma.department.create({
      data: { ...d, organizationId: org.id },
    });
    departments.push(dept);
  }

  // 4. Asset Categories
  const categories = await Promise.all([
    prisma.assetCategory.create({ data: { code: 'LAPTOP', name: 'Laptop' } }),
    prisma.assetCategory.create({ data: { code: 'PC', name: 'Desktop PC' } }),
    prisma.assetCategory.create({ data: { code: 'MONITOR', name: 'Monitor' } }),
    prisma.assetCategory.create({ data: { code: 'POS', name: 'POS Terminal' } }),
    prisma.assetCategory.create({ data: { code: 'NETWORK', name: 'Network Equipment' } }),
    prisma.assetCategory.create({ data: { code: 'BACKEND', name: 'Backend Server' } }),
    prisma.assetCategory.create({ data: { code: 'PDT', name: 'PDT Device' } }),
  ]);

  // 5. System Admin
  const adminPassword = await bcrypt.hash('Asset@2026', 10);
  const adminUser = await prisma.user.create({
    data: {
      email: 'system.admin@mapactive.vn',
      passwordHash: adminPassword,
      fullName: 'System Administrator',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  // 6. Sample Employees (74 employees)
  const employees = [];
  for (let i = 1; i <= 74; i++) {
    const dept = departments[i % departments.length];
    const emp = await prisma.employee.create({
      data: {
        staffCode: `EMP-${String(i).padStart(4, '0')}`,
        fullName: `Employee ${i}`,
        email: `emp${i}@mapactive.vn`,
        departmentId: dept.id,
        organizationId: org.id,
      },
    });
    employees.push(emp);

    // Create user account
    const userPassword = await bcrypt.hash('User@2026', 10);
    await prisma.user.create({
      data: {
        email: emp.email,
        passwordHash: userPassword,
        fullName: emp.fullName,
        role: UserRole.USER,
        isActive: true,
        employeeId: emp.id,
      },
    });
  }

  // 7. Office Assets (110 assets)
  for (let i = 1; i <= 110; i++) {
    const catIndex = i % 3; // Laptop, PC, Monitor rotation
    const category = categories[catIndex];
    const location = i % 2 === 0 ? hcmOffice : hnOffice;
    const status = i % 3 === 0 ? AssetStatus.AVAILABLE : AssetStatus.IN_USE;

    await prisma.asset.create({
      data: {
        assetCode: `HCM-IT-${category.code}-${String(i).padStart(4, '0')}`,
        name: `${category.name} ${i}`,
        serialNumber: `SN${String(Math.floor(Math.random() * 1000000)).padStart(7, '0')}`,
        status,
        categoryId: category.id,
        locationId: location.id,
        departmentId: departments[i % departments.length].id,
      },
    });
  }

  // 8. Store Assets (640 assets ~ 18-20 per store)
  for (const store of stores) {
    // Each store gets: 9 POS, 4 Network, 4 Backend, 2 PDT
    for (let j = 0; j < 9; j++) {
      await prisma.asset.create({
        data: {
          assetCode: `${store.code}-POS-${String(j + 1).padStart(3, '0')}`,
          name: `${store.name} POS Terminal ${j + 1}`,
          serialNumber: `SN${String(Math.floor(Math.random() * 1000000)).padStart(7, '0')}`,
          status: AssetStatus.IN_USE,
          categoryId: categories.find(c => c.code === 'POS')!.id,
          locationId: store.id,
        },
      });
    }

    for (let j = 0; j < 4; j++) {
      await prisma.asset.create({
        data: {
          assetCode: `${store.code}-NET-${String(j + 1).padStart(3, '0')}`,
          name: `${store.name} Network Device ${j + 1}`,
          serialNumber: `SN${String(Math.floor(Math.random() * 1000000)).padStart(7, '0')}`,
          status: AssetStatus.IN_USE,
          categoryId: categories.find(c => c.code === 'NETWORK')!.id,
          locationId: store.id,
        },
      });
    }

    for (let j = 0; j < 4; j++) {
      await prisma.asset.create({
        data: {
          assetCode: `${store.code}-BE-${String(j + 1).padStart(3, '0')}`,
          name: `${store.name} Backend Server ${j + 1}`,
          serialNumber: `SN${String(Math.floor(Math.random() * 1000000)).padStart(7, '0')}`,
          status: AssetStatus.IN_USE,
          categoryId: categories.find(c => c.code === 'BACKEND')!.id,
          locationId: store.id,
        },
      });
    }

    for (let j = 0; j < 2; j++) {
      await prisma.asset.create({
        data: {
          assetCode: `${store.code}-PDT-${String(j + 1).padStart(3, '0')}`,
          name: `${store.name} PDT ${j + 1}`,
          serialNumber: `SN${String(Math.floor(Math.random() * 1000000)).padStart(7, '0')}`,
          status: AssetStatus.IN_USE,
          categoryId: categories.find(c => c.code === 'PDT')!.id,
          locationId: store.id,
        },
      });
    }
  }

  console.log('✅ Seeding completed!');
  console.log('📊 Summary:');
  console.log(`  - Organizations: 1`);
  console.log(`  - Locations: 36 (2 offices + 34 stores)`);
  console.log(`  - Departments: ${departments.length}`);
  console.log(`  - Employees: 74`);
  console.log(`  - Users: 75 (74 employees + 1 admin)`);
  console.log(`  - Assets: 756 (110 office + 646 store)`);
  console.log('');
  console.log('🔑 Login credentials:');
  console.log('   Email: system.admin@mapactive.vn');
  console.log('   Password: Asset@2026');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
