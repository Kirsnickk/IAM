import { PrismaClient, AssetStatus, AssignmentStatus, MaintenancePriority, MaintenanceStatus, TransferStatus, UserRole } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const root = path.resolve(process.cwd(), '../..');
const firstMapValue = (values: Map<string, string>) => Array.from(values.values())[0];
const dataDir = process.env.NORMALIZED_DATA_DIR || path.join(root, 'Data clear', 'v2_normalized');
const apply = process.argv.includes('--apply');
const allowReview = process.argv.includes('--allow-review');
const allowProduction = process.env.ALLOW_PRODUCTION_IMPORT === 'true';

type Row = Record<string, string>;
const csv = (name: string): Row[] => {
  const file = path.join(dataDir, name);
  if (!fs.existsSync(file)) throw new Error(`Missing normalized file: ${file}`);
  const lines = fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, '').split(/\r?\n/).filter(Boolean);
  const parse = (line: string) => {
    const out: string[] = [];
    let value = '', quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"' && line[i + 1] === '"') { value += '"'; i += 1; continue; }
      if (ch === '"') { quoted = !quoted; continue; }
      if (ch === ',' && !quoted) { out.push(value); value = ''; continue; }
      value += ch;
    }
    out.push(value);
    return out;
  };
  const headers = parse(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parse(line);
    return Object.fromEntries(headers.map((header, i) => [header, values[i] || '']));
  });
};

const required = (row: Row, field: string) => row[field] || undefined;
const dateOrNull = (value: string) => value ? new Date(value) : undefined;
const decimalOrNull = (value: string) => value && !Number.isNaN(Number(value)) ? Number(value) : undefined;
const enumValue = <T extends string>(value: string, allowed: readonly T[], fallback: T): T => allowed.includes(value as T) ? value as T : fallback;

async function dryRun() {
  const files = ['organizations.csv', 'locations.csv', 'departments.csv', 'employees.csv', 'asset_categories.csv', 'asset_models.csv', 'assets.csv', 'asset_assignments.csv', 'asset_transfers.csv', 'maintenance_tickets.csv', 'warehouses.csv'];
  const counts = Object.fromEntries(files.map((file) => [file, csv(file).length]));
  const issues = csv('data_quality_issues.csv');
  const errors = issues.filter((row) => row.severity === 'ERROR');
  console.log(JSON.stringify({ mode: 'dry-run', dataDir, counts, qualityIssues: issues.length, qualityErrors: errors.length, applyCommand: 'npm run db:import-v2 -- --apply --allow-review', productionGuard: 'ALLOW_PRODUCTION_IMPORT=true' }, null, 2));
}

async function applyImport() {
  const issues = csv('data_quality_issues.csv');
  const errors = issues.filter((row) => row.severity === 'ERROR');
  const blockingTypes = new Set(['DUPLICATE_SERIAL_CROSS_LOCATION', 'ASSET_KEY_CONFLICT', 'UNKNOWN_EMPLOYEE_REFERENCE', 'MISSING_STORE_MASTER']);
  const unresolvedIdentityIssues = issues.filter((row) => blockingTypes.has(row.issue_type));
  if (errors.length || (unresolvedIdentityIssues.length && !allowReview)) {
    throw new Error(`Import blocked: ${errors.length} ERROR and ${unresolvedIdentityIssues.length} blocking identity/location issues. Review data_quality_issues.csv or pass --allow-review explicitly.`);
  }
  const databaseUrl = process.env.DATABASE_URL || '';
  const productionLike = /neon|render|morning-frog/i.test(databaseUrl);
  if (productionLike && !allowProduction) throw new Error('Production-like DATABASE_URL detected. Set ALLOW_PRODUCTION_IMPORT=true only after explicit production approval.');

  const adminPassword = process.env.IMPORT_ADMIN_PASSWORD || 'ChangeMe-ImportOnly-2026!';
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const admin = await prisma.user.upsert({ where: { email: 'system.import@mapactive.vn' }, update: {}, create: { email: 'system.import@mapactive.vn', passwordHash, fullName: 'Normalized Data Import', role: UserRole.ADMIN } });
  const org = await prisma.organization.upsert({ where: { code: 'MAP-VN' }, update: { name: 'MAP Active Vietnam' }, create: { code: 'MAP-VN', name: 'MAP Active Vietnam' } });
  const locationIds = new Map<string, string>();
  for (const row of csv('locations.csv')) {
    const location = await prisma.location.upsert({ where: { code: required(row, 'location_code')! }, update: { name: required(row, 'name')!, address: required(row, 'region') }, create: { code: required(row, 'location_code')!, name: required(row, 'name')!, address: required(row, 'region'), organizationId: org.id } });
    locationIds.set(row.location_code, location.id);
  }
  const departmentIds = new Map<string, string>();
  for (const row of csv('departments.csv')) {
    const department = await prisma.department.upsert({ where: { code: required(row, 'department_code')! }, update: { name: required(row, 'name')! }, create: { code: required(row, 'department_code')!, name: required(row, 'name')!, organizationId: org.id } });
    departmentIds.set(row.department_code, department.id);
  }
  const employeeIds = new Map<string, string>();
  for (const row of csv('employees.csv')) {
    const email = required(row, 'email') || `${row.employee_id.toLowerCase()}@import.invalid`;
    const user = await prisma.user.upsert({ where: { email }, update: { fullName: required(row, 'full_name')! }, create: { email, passwordHash, fullName: required(row, 'full_name')!, role: UserRole.EMPLOYEE } });
    const departmentId = departmentIds.get(row.department_code) || firstMapValue(departmentIds);
    if (!departmentId) throw new Error(`No department for employee ${row.employee_id}`);
    const employee = await prisma.employee.upsert({ where: { staffCode: row.employee_id }, update: { fullName: row.full_name, email, position: row.position, departmentId, userId: user.id, isActive: row.status === 'ACTIVE' }, create: { staffCode: row.employee_id, fullName: row.full_name, email, position: row.position, departmentId, userId: user.id, isActive: row.status === 'ACTIVE' } });
    employeeIds.set(row.employee_id, employee.id);
  }
  const categoryIds = new Map<string, string>();
  for (const row of csv('asset_categories.csv')) {
    const category = await prisma.assetCategory.upsert({ where: { code: row.category_code }, update: { name: row.name }, create: { code: row.category_code, name: row.name } });
    categoryIds.set(row.category_code, category.id);
  }
  const modelIds = new Map<string, string>();
  for (const row of csv('asset_models.csv')) {
    const categoryId = categoryIds.get(row.category_code);
    if (!categoryId) throw new Error(`Missing category ${row.category_code} for model ${row.model_code}`);
    const model = await prisma.assetModel.upsert({ where: { code: row.model_code }, update: { name: row.name, manufacturer: row.manufacturer }, create: { code: row.model_code, name: row.name, manufacturer: row.manufacturer, categoryId } });
    modelIds.set(row.model_code, model.id);
  }
  const assetIds = new Map<string, string>();
  for (const row of csv('assets.csv')) {
    const locationId = locationIds.get(row.location_code);
    const categoryId = categoryIds.get(row.category_code);
    const modelId = modelIds.get(row.model_code);
    if (!locationId || !categoryId || !modelId) throw new Error(`Broken asset reference ${row.asset_key}`);
    const status = enumValue(row.status, ['AVAILABLE', 'IN_USE', 'UNDER_MAINTENANCE', 'DISPOSED', 'LOST', 'RESERVED'] as const, 'AVAILABLE');
    const asset = await prisma.asset.upsert({ where: { assetCode: row.asset_code }, update: { name: row.name, serialNumber: row.serial_number || undefined, status: status as AssetStatus, locationId, categoryId, modelId, notes: row.notes, isDeleted: false }, create: { assetCode: row.asset_code, name: row.name, serialNumber: row.serial_number || undefined, status: status as AssetStatus, locationId, categoryId, modelId, notes: row.notes } });
    assetIds.set(row.asset_key, asset.id);
  }
  for (const row of csv('asset_assignments.csv')) {
    const assetId = assetIds.get(row.asset_key);
    const employeeId = employeeIds.get(row.employee_id);
    if (!assetId || !employeeId) continue;
    const existing = await prisma.assetAssignment.findFirst({ where: { assetId, employeeId, status: enumValue(row.status, ['ACTIVE', 'RETURNED', 'TRANSFERRED'] as const, 'ACTIVE') as AssignmentStatus } });
    if (!existing) {
      await prisma.assetAssignment.create({ data: { assetId, employeeId, assignedById: admin.id, assignedDate: dateOrNull(row.assigned_date), actualReturnDate: dateOrNull(row.actual_return_date), status: enumValue(row.status, ['ACTIVE', 'RETURNED', 'TRANSFERRED'] as const, 'ACTIVE') as AssignmentStatus, notes: row.notes } });
    } else {
      await prisma.assetAssignment.update({ where: { id: existing.id }, data: { notes: row.notes, actualReturnDate: dateOrNull(row.actual_return_date) } });
    }
  }
  for (const row of csv('maintenance_tickets.csv')) {
    const assetId = assetIds.get(row.asset_key);
    if (!assetId) continue;
    const reporter = row.reported_by_employee_id ? employeeIds.get(row.reported_by_employee_id) : undefined;
    if (!reporter) continue;
    await prisma.maintenanceTicket.upsert({ where: { ticketNo: row.ticket_no }, update: { assetId, title: row.title, description: row.description }, create: { ticketNo: row.ticket_no, assetId, title: row.title, description: row.description, priority: enumValue(row.priority, ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const, 'HIGH') as MaintenancePriority, status: enumValue(row.status, ['OPEN', 'IN_PROGRESS', 'WAITING_PARTS', 'RESOLVED', 'CANCELLED'] as const, 'OPEN') as MaintenanceStatus, reportedById: reporter } });
  }
  for (const row of csv('warehouses.csv')) {
    const locationId = locationIds.get(row.location_code);
    if (!locationId) continue;
    await prisma.warehouse.upsert({ where: { code: row.warehouse_code }, update: { name: row.name, locationId }, create: { code: row.warehouse_code, name: row.name, locationId } });
  }
  console.log(JSON.stringify({ mode: 'apply', status: 'completed', assets: assetIds.size, employees: employeeIds.size, locations: locationIds.size }, null, 2));
}

(async () => {
  try {
    if (!apply) await dryRun();
    else await applyImport();
  } finally {
    await prisma.$disconnect();
  }
})().catch((error) => { console.error(error); process.exit(1); });
