import { Router, Response } from 'express';
import { prisma } from '../../app.js';
import { authMiddleware, AuthRequest, requireRoles, auditLog } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// GET /api/v1/transfers
router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const transfers = await prisma.assetTransfer.findMany({
      include: {
        asset: { select: { assetCode: true, name: true } },
        fromLocation: { select: { name: true, code: true } },
        toLocation: { select: { name: true, code: true } },
        fromDepartment: { select: { name: true } },
        toDepartment: { select: { name: true } },
        requestedBy: { select: { fullName: true } },
        approvedBy: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, transfers });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/v1/transfers — Tạo phiếu điều chuyển
router.post('/', requireRoles('ADMIN', 'ASSET_MANAGER', 'DEPT_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const transfer = await prisma.assetTransfer.create({
      data: { ...req.body, requestedById: req.user!.userId },
      include: { asset: true, fromLocation: true, toLocation: true },
    });
    await auditLog('transfer', transfer.id, 'CREATE', null, transfer, req.user!.userId);
    res.status(201).json({ success: true, transfer });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// PATCH /api/v1/transfers/:id — Phê duyệt / từ chối
router.patch('/:id', requireRoles('ADMIN', 'ASSET_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    const old = await prisma.assetTransfer.findUnique({ where: { id: req.params.id } });
    if (!old || old.status !== 'PENDING') {
      res.status(400).json({ success: false, message: 'Phiếu không ở trạng thái chờ duyệt' });
      return;
    }

    const data: any = { status, approvedById: req.user!.userId, approvedAt: new Date() };

    const transfer = await prisma.assetTransfer.update({ where: { id: req.params.id }, data });
    await auditLog('transfer', transfer.id, 'UPDATE', old, transfer, req.user!.userId);
    res.json({ success: true, transfer });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/v1/transfers/:id/confirm — Bên nhận xác nhận
router.post('/:id/confirm', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const old = await prisma.assetTransfer.findUnique({ where: { id: req.params.id } });
    if (!old || old.status !== 'APPROVED') {
      res.status(400).json({ success: false, message: 'Phiếu chưa được duyệt' });
      return;
    }

    const [transfer] = await prisma.$transaction([
      prisma.assetTransfer.update({
        where: { id: req.params.id },
        data: { status: 'COMPLETED', confirmedById: req.user!.userId, completedAt: new Date() },
      }),
      prisma.asset.update({
        where: { id: old.assetId },
        data: { locationId: old.toLocationId, departmentId: old.toDepartmentId },
      }),
    ]);

    await auditLog('transfer', transfer.id, 'UPDATE', old, transfer, req.user!.userId);
    res.json({ success: true, transfer, message: 'Đã xác nhận tiếp nhận tài sản' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
