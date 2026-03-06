import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import prisma from '../prisma/client';
import { generateToken } from '../middleware/auth';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  body('username').isLength({ min: 3, max: 30 }).trim(),
  body('password').isLength({ min: 6 }),
  body('displayName').isLength({ min: 1, max: 50 }).trim(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, password, displayName } = req.body;

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return res.status(400).json({ error: 'Username already exists' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { username, passwordHash, displayName },
    });

    // First user to register automatically becomes the guild leader
    const memberCount = await prisma.member.count();
    let member = null;
    if (memberCount === 0) {
      member = await prisma.member.create({
        data: {
          userId: user.id,
          displayName,
          wowClass: 'warrior',
          wowClassZh: '战士',
          isLeader: true,
          status: 'active',
        },
      });
    }

    const token = generateToken(user.id);
    return res.status(201).json({
      token,
      user: { id: user.id, username: user.username, displayName: user.displayName },
      member: member
        ? {
            id: member.id,
            displayName: member.displayName,
            wowClass: member.wowClass,
            wowClassZh: member.wowClassZh,
            isLeader: member.isLeader,
            status: member.status,
          }
        : null,
    });
  }
);

// POST /api/auth/login
router.post(
  '/login',
  body('username').notEmpty().trim(),
  body('password').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, password } = req.body;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const member = await prisma.member.findFirst({
      where: { userId: user.id },
    });

    const token = generateToken(user.id);
    return res.json({
      token,
      user: { id: user.id, username: user.username, displayName: user.displayName },
      member: member
        ? {
            id: member.id,
            displayName: member.displayName,
            wowClass: member.wowClass,
            wowClassZh: member.wowClassZh,
            isLeader: member.isLeader,
            status: member.status,
          }
        : null,
    });
  }
);

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });

  const jwt = await import('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
  try {
    const payload = jwt.default.verify(authHeader.split(' ')[1], JWT_SECRET) as { userId: number };
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const member = await prisma.member.findFirst({ where: { userId: user.id } });
    return res.json({
      user: { id: user.id, username: user.username, displayName: user.displayName },
      member: member
        ? {
            id: member.id,
            displayName: member.displayName,
            wowClass: member.wowClass,
            wowClassZh: member.wowClassZh,
            isLeader: member.isLeader,
            status: member.status,
          }
        : null,
    });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
