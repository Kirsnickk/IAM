import { Router, Response } from 'express';
import { prisma } from '../../app.js';
import { authMiddleware, AuthRequest } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// GET /api/v1/reports/dashboard — Tổng quan
router.get('/dashboard', async (_req: AuthRequest, res: Response) => {
  try {
    const [totalAssets, byStatus, byCategory, byLocation, recentTransfers, openTickets] = await Promise.all([
      prisma.asset.count({ where: { isDeleted: false } }),
      prisma.asset.groupBy({ by: ['status'], _count: true, where: { isDeleted: false } }),
      prisma.asset.groupBy({ by: ['categoryId'], _count: true, where: { isDeleted: false } }),
      prisma.asset.groupBy({ by: ['locationId'], _count: true, where: { isDeleted: false } }),
      prisma.assetTransfer.count({ where: { status: 'PENDING' } }),
      prisma.maintenanceTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    ]);

    // Enrich category and location names
    const categoryIds = byCategory.map((c: any) => c.categoryId);
    const locationIds = byLocation.map((l: any) => l.locationId);

    const [categories, locations] = await Promise.all([
      prisma.assetCategory.findMany({ where: { id: { in: categoryIds } }, select: { id: true, name: true } }),
      prisma.location.findMany({ where: { id: { in: locationIds } }, select: { id: true, name: true } }),
    ]);

    const categoryMap = Object.fromEntries(categories.map((c: any) => [c.id, c.name]));
    const locationMap = Object.fromEntries(locations.map((l: any) => [l.id, l.name]));

    res.json({
      success: true,
      dashboard: {
        totalAssets,
        byStatus: byStatus.map((s: any) => ({ status: s.status, count: s._count })),
        byCategory: byCategory.map((c: any) => ({ category: categoryMap[c.categoryId] || c.categoryId, count: c._count })),
        byLocation: byLocation.map((l: any) => ({ location: locationMap[l.locationId] || l.locationId, count: l._count })),
        pendingTransfers: recentTransfers,
        openMaintenanceTickets: openTickets,
      },
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// GET /api/v1/reports/by-department
router.get('/by-department', async (_req: AuthRequest, res: Response) => {
  try {
    const data = await prisma.asset.groupBy({
      by: ['departmentId'],
      _count: true,
      _sum: { purchasePrice: true, currentValue: true },
      where: { isDeleted: false, departmentId: { not: null } },
    });

    const deptIds = data.map((d: any) => d.departmentId!).filter(Boolean);
    const departments = await prisma.department.findMany({ where: { id: { in: deptIds } }, select: { id: true, name: true, code: true } });
    const deptMap = Object.fromEntries(departments.map((d: any) => [d.id, d]));

    res.json({
      success: true,
      report: data.map((d: any) => ({
        department: deptMap[d.departmentId!] || { name: 'N/A' },
        assetCount: d._count,
        totalPurchasePrice: d._sum.purchasePrice,
        totalCurrentValue: d._sum.currentValue,
      })),
    });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
