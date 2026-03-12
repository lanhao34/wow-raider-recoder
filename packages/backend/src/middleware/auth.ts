import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export interface AuthRequest extends Request {
  userId?: number;
  isLeader?: boolean;
  isSuperAdmin?: boolean;
  memberId?: number;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number; isSuperAdmin?: boolean };
    req.userId = payload.userId;
    req.isSuperAdmin = payload.isSuperAdmin || false;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function requireLeader(req: AuthRequest, res: Response, next: NextFunction) {
  authenticate(req, res, async () => {
    // Super admin has leader permissions
    if (req.isSuperAdmin) {
      req.isLeader = true;
      return next();
    }
    
    const member = await prisma.member.findFirst({
      where: { userId: req.userId, isLeader: true },
    });
    if (!member) {
      return res.status(403).json({ error: 'Leader access required' });
    }
    req.isLeader = true;
    req.memberId = member.id;
    next();
  });
}

export async function loadMember(req: AuthRequest, _res: Response, next: NextFunction) {
  if (req.userId) {
    // Super admin has leader permissions
    if (req.isSuperAdmin) {
      req.isLeader = true;
      return next();
    }
    
    const member = await prisma.member.findFirst({
      where: { userId: req.userId },
    });
    if (member) {
      req.isLeader = member.isLeader;
      req.memberId = member.id;
    }
  }
  next();
}

export function generateToken(userId: number, isSuperAdmin: boolean = false): string {
  return jwt.sign({ userId, isSuperAdmin }, JWT_SECRET, { expiresIn: '30d' });
}
