import { Router, Response } from 'express';
import { prisma } from '../../app.js';
import { authMiddleware, AuthRequest, requireRoles, auditLog } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// ===================== ORGANIZATIONS =====================
router.get('/organizations', async (_req: AuthRequest, res: Response) => {
  const items = await prisma.organization.findMany({ include: { children: true }, orderBy: { name: 'asc' } });
  res.json({ success: true, organizations: items });
});

router.post('/organizations', requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.organization.create({ data: req.body });
    await auditLog('organization', item.id, 'CREATE', null, item, req.user!.userId);
    res.status(201).json({ success: true, organization: item });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.patch('/organizations/:id', requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const old = await prisma.organization.findUnique({ where: { id: req.params.id } });
    const item = await prisma.organization.update({ where: { id: req.params.id }, data: req.body });
    await auditLog('organization', item.id, 'UPDATE', old, item, req.user!.userId);
    res.json({ success: true, organization: item });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.delete('/organizations/:id', requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.organization.delete({ where: { id: req.params.id } });
    await auditLog('organization', req.params.id, 'DELETE', null, null, req.user!.userId);
    res.json({ success: true, message: 'Đã xoá' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ===================== LOCATIONS =====================
router.get('/locations', async (_req: AuthRequest, res: Response) => {
  const items = await prisma.location.findMany({ include: { organization: { select: { name: true } } }, orderBy: { name: 'asc' } });
  res.json({ success: true, locations: items });
});

router.post('/locations', requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.location.create({ data: req.body });
    await auditLog('location', item.id, 'CREATE', null, item, req.user!.userId);
    res.status(201).json({ success: true, location: item });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.patch('/locations/:id', requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const old = await prisma.location.findUnique({ where: { id: req.params.id } });
    const item = await prisma.location.update({ where: { id: req.params.id }, data: req.body });
    await auditLog('location', item.id, 'UPDATE', old, item, req.user!.userId);
    res.json({ success: true, location: item });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ===================== DEPARTMENTS =====================
router.get('/departments', async (_req: AuthRequest, res: Response) => {
  const items = await prisma.department.findMany({ include: { organization: { select: { name: true } } }, orderBy: { name: 'asc' } });
  res.json({ success: true, departments: items });
});

router.post('/departments', requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.department.create({ data: req.body });
    await auditLog('department', item.id, 'CREATE', null, item, req.user!.userId);
    res.status(201).json({ success: true, department: item });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

router.patch('/departments/:id', requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const old = await prisma.department.findUnique({ where: { id: req.params.id } });
    const item = await prisma.department.update({ where: { id: req.params.id }, data: req.body });
    await auditLog('department', item.id, 'UPDATE', old, item, req.user!.userId);
    res.json({ success: true, department: item });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ===================== EMPLOYEES =====================
router.get('/employees', async (req: AuthRequest, res: Response) => {
  const { departmentId } = req.query as Record<string, string>;
  const where: any = {};
  if (departmentId) where.departmentId = departmentId;
  const items = await prisma.employee.findMany({ where, include: { department: { select: { name: true, code: true } } }, orderBy: { fullName: 'asc' } });
  res.json({ success: true, employees: items });
});

router.post('/employees', requireRoles('ADMIN', 'ASSET_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.employee.create({ data: req.body, include: { department: true } });
    await auditLog('employee', item.id, 'CREATE', null, item, req.user!.userId);
    res.status(201).json({ success: true, employee: item });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ===================== VENDORS =====================
router.get('/vendors', async (_req: AuthRequest, res: Response) => {
  const items = await prisma.vendor.findMany({ orderBy: { name: 'asc' } });
  res.json({ success: true, vendors: items });
});

router.post('/vendors', requireRoles('ADMIN', 'PROCUREMENT'), async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.vendor.create({ data: req.body });
    await auditLog('vendor', item.id, 'CREATE', null, item, req.user!.userId);
    res.status(201).json({ success: true, vendor: item });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ===================== CATEGORIES =====================
router.get('/categories', async (_req: AuthRequest, res: Response) => {
  const items = await prisma.assetCategory.findMany({ include: { children: true }, orderBy: { name: 'asc' } });
  res.json({ success: true, categories: items });
});

router.post('/categories', requireRoles('ADMIN', 'ASSET_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.assetCategory.create({ data: req.body });
    await auditLog('asset_category', item.id, 'CREATE', null, item, req.user!.userId);
    res.status(201).json({ success: true, category: item });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ===================== ASSET MODELS =====================
router.get('/models', async (_req: AuthRequest, res: Response) => {
  const items = await prisma.assetModel.findMany({ include: { category: { select: { name: true } } }, orderBy: { name: 'asc' } });
  res.json({ success: true, models: items });
});

router.post('/models', requireRoles('ADMIN', 'ASSET_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.assetModel.create({ data: req.body });
    await auditLog('asset_model', item.id, 'CREATE', null, item, req.user!.userId);
    res.status(201).json({ success: true, model: item });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ===================== WAREHOUSES =====================
router.get('/warehouses', async (_req: AuthRequest, res: Response) => {
  const items = await prisma.warehouse.findMany({ include: { location: { select: { name: true } } }, orderBy: { name: 'asc' } });
  res.json({ success: true, warehouses: items });
});

router.post('/warehouses', requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.warehouse.create({ data: req.body });
    await auditLog('warehouse', item.id, 'CREATE', null, item, req.user!.userId);
    res.status(201).json({ success: true, warehouse: item });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// ===================== USERS (manage) =====================
router.get('/users', requireRoles('ADMIN'), async (_req: AuthRequest, res: Response) => {
  const items = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true, role: true, isActive: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, users: items });
});

export default router;
