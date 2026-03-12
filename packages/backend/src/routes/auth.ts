import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import prisma from '../prisma/client';
import { generateToken } from '../middleware/auth';

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  body('username')
    .isLength({ min: 3, max: 30 }).withMessage('用户名长度 3-30 个字符')
    .trim(),
  body('password')
    .isLength({ min: 6 }).withMessage('密码长度至少 6 位'),
  body('displayName').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMsg = errors.array()[0].msg;
      return res.status(400).json({ error: errorMsg });
    }

    const { username, password, displayName } = req.body;

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return res.status(400).json({ error: '用户名已存在' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { username, passwordHash, displayName: displayName || username },
    });

    // 注册时不再自动创建角色
    // 用户登录后可以认领角色或创建新角色
    const token = generateToken(user.id);
    return res.status(201).json({
      token,
      user: { id: user.id, username: user.username, displayName: user.displayName },
      member: null,
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
    if (!errors.isEmpty()) {
      const errorMsg = errors.array()[0].msg;
      return res.status(400).json({ error: errorMsg });
    }

    const { username, password } = req.body;

    // 检查是否是超级管理员
    if (username === 'admin' && password === 'Admin0306') {
      // 确保超级管理员用户存在
      let user = await prisma.user.findUnique({ where: { username } });
      if (!user) {
        const passwordHash = await bcrypt.hash(password, 12);
        user = await prisma.user.create({
          data: { username, passwordHash, displayName: '超级管理员', isSuperAdmin: true },
        });
      } else {
        // 更新为超级管理员
        await prisma.user.update({
          where: { id: user.id },
          data: { isSuperAdmin: true },
        });
      }

      const token = generateToken(user.id, true);
      return res.json({
        token,
        user: { id: user.id, username: user.username, displayName: user.displayName },
        member: null,
        isSuperAdmin: true,
      });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ error: '用户名或密码错误' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: '用户名或密码错误' });

    const member = await prisma.member.findFirst({
      where: { userId: user.id },
    });

    const token = generateToken(user.id, user.isSuperAdmin || false);
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
      isSuperAdmin: user.isSuperAdmin || false,
    });
  }
);

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: '未登录' });

  const jwt = await import('jsonwebtoken');
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
  try {
    const payload = jwt.default.verify(authHeader.split(' ')[1], JWT_SECRET) as { userId: number; isSuperAdmin?: boolean };
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(404).json({ error: '用户不存在' });

    const members = await prisma.member.findMany({ where: { userId: user.id } });
    return res.json({
      user: { id: user.id, username: user.username, displayName: user.displayName },
      members: members.map(m => ({
        id: m.id,
        displayName: m.displayName,
        wowClass: m.wowClass,
        wowClassZh: m.wowClassZh,
        isLeader: m.isLeader,
        status: m.status,
      })),
      isSuperAdmin: user.isSuperAdmin || false,
    });
  } catch {
    return res.status(401).json({ error: '登录已过期' });
  }
});

export default router;
