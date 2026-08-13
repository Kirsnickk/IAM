import { Request, Response, NextFunction } from 'express';
import * as jwtModule from 'jsonwebtoken';
import { prisma } from '../app.js';

const jwt = (jwtModule as any).default || jwtModule;
const JWT_SECRET = process.env.JWT_SECRET || 'development-only-secret';

export interface AuthPayload {
  userId: string;
  role: string;
}

export type AuthRequest = Request & {
  user?: AuthPayload;
};

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Token không được cung cấp' });
    return;
  }

  try {
    const token = authHeader.substring(7);
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc hết hạn' });
  }
}

export function requireRoles(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Chưa xác thực' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Không đủ quyền truy cập' });
      return;
    }
    next();
  };
}

export async function auditLog(
  entityType: string, entityId: string, action: string,
  oldValues: any, newValues: any, userId: string, ipAddress?: string
) {
  await prisma.auditLog.create({
    data: { entityType, entityId, action, oldValues, newValues, userId, ipAddress },
  });
}
