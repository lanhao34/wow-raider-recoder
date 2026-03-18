import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export interface AuthRequest extends Request {
  userId?: number;
  isAdmin?: boolean;
  memberId?: number;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number; isAdmin?: boolean };
    req.userId = payload.userId;
    req.isAdmin = payload.isAdmin || false;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  authenticate(req, res, async () => {
    // Check User.isAdmin field
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { isAdmin: true, username: true },
    });
    
    // Also check hard-coded admin username
    if (user?.isAdmin || user?.username === 'admin') {
      req.isAdmin = true;
      return next();
    }
    
    return res.status(403).json({ error: 'Admin access required' });
  });
}

export async function loadMember(req: AuthRequest, _res: Response, next: NextFunction) {
  if (req.userId) {
    // Load User.isAdmin
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { isAdmin: true, username: true },
    });
    
    if (user) {
      req.isAdmin = user.isAdmin || user.username === 'admin';
    }
  }
  next();
}

export function generateToken(userId: number, isAdmin: boolean = false): string {
  return jwt.sign({ userId, isAdmin }, JWT_SECRET, { expiresIn: '30d' });
}
