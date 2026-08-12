import { Router, Request, Response } from 'express';
import QRCode from 'qrcode';
import { prisma } from '../../app.js';
import { authMiddleware, AuthRequest, requireRoles, auditLog } from '../../middleware/auth.js';

const router = Router();

// All asset routes require auth
router.use(authMiddleware);

// GET /api/v1/assets — Danh sách tài sản (filter, sort, paginate)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { page = '1', limit = '20', status, categoryId, locationId, departmentId, search, sortBy = 'createdAt', order = 'desc' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = { isDeleted: false };
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (locationId) where.locationId = locationId;
    if (departmentId) where.departmentId = departmentId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { assetCode: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, code: true } },
          model: { select: { id: true, name: true, code: true, manufacturer: true } },
          location: { select: { id: true, name: true, code: true } },
          department: { select: { id: true, name: true, code: true } },
          vendor: { select: { id: true, name: true } },
        },
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: order },
      }),
      prisma.asset.count({ where }),
    ]);

    res.json({ success: true, assets, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/v1/assets/:id — Chi tiết tài sản
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: req.params.id },
      include: {
        category: true, model: true, location: true, department: true, vendor: true,
        assignments: { include: { employee: true }, orderBy: { assignedDate: 'desc' } },
        maintenanceTickets: { orderBy: { createdAt: 'desc' }, take: 5 },
        warranties: true,
        attachments: true,
      },
    });
    if (!asset || asset.isDeleted) {
      res.status(404).json({ success: false, message: 'Tài sản không tồn tại' });
      return;
    }
    res.json({ success: true, asset });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Helper: sinh mã tài sản tự động
async function generateAssetCode(locationCode: string, deptCode: string, categoryCode: string): Promise<string> {
  const prefix = `${locationCode}-${deptCode}-${categoryCode}`;
  const lastAsset = await prisma.asset.findFirst({
    where: { assetCode: { startsWith: prefix } },
    orderBy: { assetCode: 'desc' },
  });

  let seq = 1;
  if (lastAsset) {
    const parts = lastAsset.assetCode.split('-');
    seq = parseInt(parts[parts.length - 1]) + 1;
  }
  return `${prefix}-${String(seq).padStart(4, '0')}`;
}

// POST /api/v1/assets — Tạo mới tài sản
router.post('/', requireRoles('ADMIN', 'ASSET_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, serialNumber, modelId, categoryId, locationId, departmentId, vendorId, purchaseDate, purchasePrice, warrantyMonths, specifications, notes } = req.body;

    const [category, location, department] = await Promise.all([
      prisma.assetCategory.findUnique({ where: { id: categoryId } }),
      prisma.location.findUnique({ where: { id: locationId } }),
      departmentId ? prisma.department.findUnique({ where: { id: departmentId } }) : Promise.resolve(null),
    ]);

    if (!category || !location) {
      res.status(400).json({ success: false, message: 'Danh mục hoặc vị trí không tồn tại' });
      return;
    }

    const deptCode = department?.code || 'GEN';
    const assetCode = await generateAssetCode(location.code, deptCode, category.code);

    let warrantyExpiry: Date | undefined;
    if (purchaseDate && warrantyMonths) {
      warrantyExpiry = new Date(purchaseDate);
      warrantyExpiry.setMonth(warrantyExpiry.getMonth() + warrantyMonths);
    }

    const asset = await prisma.asset.create({
      data: {
        assetCode, name, serialNumber,
        modelId, categoryId, locationId, departmentId, vendorId,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
        purchasePrice, currentValue: purchasePrice,
        warrantyMonths, warrantyExpiry, specifications, notes,
      },
      include: { category: true, model: true, location: true, department: true },
    });

    await auditLog('asset', asset.id, 'CREATE', null, asset, req.user!.userId);

    res.status(201).json({ success: true, asset });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/v1/assets/:id — Cập nhật tài sản
router.patch('/:id', requireRoles('ADMIN', 'ASSET_MANAGER'), async (req: AuthRequest, res: Response) => {
  try {
    const old = await prisma.asset.findUnique({ where: { id: req.params.id } });
    if (!old || old.isDeleted) {
      res.status(404).json({ success: false, message: 'Tài sản không tồn tại' });
      return;
    }

    const asset = await prisma.asset.update({
      where: { id: req.params.id },
      data: req.body,
      include: { category: true, model: true, location: true, department: true },
    });

    await auditLog('asset', asset.id, 'UPDATE', old, asset, req.user!.userId);

    res.json({ success: true, asset });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/v1/assets/:id — Xoá mềm
router.delete('/:id', requireRoles('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const asset = await prisma.asset.update({
      where: { id: req.params.id },
      data: { isDeleted: true },
    });
    await auditLog('asset', asset.id, 'DELETE', null, null, req.user!.userId);
    res.json({ success: true, message: 'Đã xoá tài sản' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/v1/assets/:id/qr — Sinh QR code (PNG base64)
router.get('/:id/qr', async (req: AuthRequest, res: Response) => {
  try {
    const asset = await prisma.asset.findUnique({ where: { id: req.params.id } });
    if (!asset) {
      res.status(404).json({ success: false, message: 'Tài sản không tồn tại' });
      return;
    }

    const qrUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/assets/${asset.assetCode}`;
    const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 300, margin: 2 });

    res.json({ success: true, assetCode: asset.assetCode, qrDataUrl, qrUrl });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
