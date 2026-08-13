import { Router, Request, Response } from 'express';
import * as bcryptModule from 'bcryptjs';
import * as jwtModule from 'jsonwebtoken';
import { prisma } from '../../app.js';
import { authMiddleware, AuthRequest } from '../../middleware/auth.js';

const router = Router();
const bcrypt = (bcryptModule as any).default || bcryptModule;
const jwt = (jwtModule as any).default || jwtModule;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be configured in production');
}

const signingSecret = JWT_SECRET || 'development-only-secret';

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email và mật khẩu là bắt buộc' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
      return;
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, signingSecret, { expiresIn: JWT_EXPIRES_IN } as any);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/v1/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, fullName: true, role: true, isActive: true, scopeLocationIds: true, employee: { include: { department: true } } },
    });
    if (!user) {
      res.status(404).json({ success: false, message: 'User không tồn tại' });
      return;
    }
    res.json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
