import { Router, Response } from 'express';
import { prisma } from '../../app.js';
import { authMiddleware, AuthRequest, requireRoles } from '../../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

// GET /api/v1/audit-logs
router.get('/', requireRoles('ADMIN', 'AUDITOR'), async (req: AuthRequest, res: Response) => {
  try {
    const { entityType, entityId, userId, page = '1', limit = '50' } = req.query as Record<string, string>;
    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (userId) where.userId = userId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { fullName: true, email: true } } },
        orderBy: { occurredAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({ success: true, logs, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
  } catch (e: any) { res.status(500).json({ success: false, message: e.message }); }
});

export default router;
