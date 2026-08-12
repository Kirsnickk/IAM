import { Router, Response } from 'express';
import { prisma } from '../../app.js';
import { authMiddleware, AuthRequest, requireRoles, auditLog } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// GET /api/v1/assignments — Danh sách cấp phát
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query as Record<string, string>;
    const where: any = {};
    if (status) where.status = status;

    const assignments = await prisma.assetAssignment.findMany({
      where,
      include: {
        asset: { select: { id: true, assetCode: true, name: true, status: true } },
        employee: { select: { id: true, fullName: true, staffCode: true, department: { select: { name: true } } } },
        assignedBy: { select: { fullName: true } },
      },
      orderBy: { assignedDate: 'desc' },
    });
    res.json({ success: true, assignments });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/v1/assignments — Cấp phát tài sản
router.post('/', requireRoles('ADMIN', 'ASSET_MANAGER', 'DEPT_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const { assetId, employeeId, assignedDate, expectedReturnDate, notes } = req.body;

    // Kiểm tra tài sản available
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset || asset.status !== 'AVAILABLE') {
      res.status(400).json({ success: false, message: 'Tài sản không có sẵn để cấp phát' });
      return;
    }

    const [assignment] = await prisma.$transaction([
      prisma.assetAssignment.create({
        data: {
          assetId, employeeId,
          assignedDate: assignedDate ? new Date(assignedDate) : new Date(),
          expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : undefined,
          assignedById: req.user!.userId,
          notes,
        },
        include: { asset: true, employee: true },
      }),
      prisma.asset.update({ where: { id: assetId }, data: { status: 'IN_USE' } }),
    ]);

    await auditLog('assignment', assignment.id, 'CREATE', null, assignment, req.user!.userId);
    res.status(201).json({ success: true, assignment });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/v1/assignments/:id/return — Thu hồi
router.post('/:id/return', requireRoles('ADMIN', 'ASSET_MANAGER', 'IT_SUPPORT'), async (req: AuthRequest, res: Response) => {
  try {
    const assignment = await prisma.assetAssignment.findUnique({ where: { id: req.params.id } });
    if (!assignment || assignment.status !== 'ACTIVE') {
      res.status(400).json({ success: false, message: 'Phiếu cấp phát không hợp lệ' });
      return;
    }

    const [updated] = await prisma.$transaction([
      prisma.assetAssignment.update({
        where: { id: req.params.id },
        data: { status: 'RETURNED', actualReturnDate: new Date() },
      }),
      prisma.asset.update({ where: { id: assignment.assetId }, data: { status: 'AVAILABLE' } }),
    ]);

    await auditLog('assignment', updated.id, 'UPDATE', assignment, updated, req.user!.userId);
    res.json({ success: true, assignment: updated, message: 'Đã thu hồi tài sản' });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
