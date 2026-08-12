import { Router, Response } from 'express';
import { prisma } from '../../app.js';
import { authMiddleware, AuthRequest, requireRoles, auditLog } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// Counter for ticket numbers
async function nextTicketNo(): Promise<string> {
  const count = await prisma.maintenanceTicket.count();
  return `MT-${String(count + 1).padStart(5, '0')}`;
}

// GET /api/v1/maintenance
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { status, priority } = req.query as Record<string, string>;
    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tickets = await prisma.maintenanceTicket.findMany({
      where,
      include: {
        asset: { select: { assetCode: true, name: true } },
        reportedBy: { select: { fullName: true, staffCode: true } },
        assignedTo: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, tickets });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// POST /api/v1/maintenance — Tạo ticket bảo trì
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const ticketNo = await nextTicketNo();
    const ticket = await prisma.maintenanceTicket.create({
      data: { ...req.body, ticketNo },
      include: { asset: true, reportedBy: true },
    });

    // Cập nhật status tài sản
    await prisma.asset.update({ where: { id: req.body.assetId }, data: { status: 'UNDER_MAINTENANCE' } });

    await auditLog('maintenance', ticket.id, 'CREATE', null, ticket, req.user!.userId);
    res.status(201).json({ success: true, ticket });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

// PATCH /api/v1/maintenance/:id — Cập nhật trạng thái
router.patch('/:id', requireRoles('ADMIN', 'ASSET_MANAGER', 'IT_SUPPORT'), async (req: AuthRequest, res: Response) => {
  try {
    const old = await prisma.maintenanceTicket.findUnique({ where: { id: req.params.id } });
    const data: any = { ...req.body };

    if (req.body.status === 'IN_PROGRESS') data.startedAt = new Date();
    if (req.body.status === 'RESOLVED') {
      data.resolvedAt = new Date();
      // Trả lại trạng thái tài sản
      if (old) await prisma.asset.update({ where: { id: old.assetId }, data: { status: 'AVAILABLE' } });
    }

    const ticket = await prisma.maintenanceTicket.update({
      where: { id: req.params.id }, data,
      include: { asset: true },
    });

    await auditLog('maintenance', ticket.id, 'UPDATE', old, ticket, req.user!.userId);
    res.json({ success: true, ticket });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
