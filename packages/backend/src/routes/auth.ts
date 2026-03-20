import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import prisma from '../prisma/client';
import { generateToken, authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'Admin0306';

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

    // 检查是否是保留的管理员用户名
    if (username === ADMIN_USERNAME) {
      return res.status(400).json({ error: '该用户名已被保留' });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) return res.status(400).json({ error: '用户名已存在' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { username, passwordHash, displayName: displayName || username, isAdmin: false },
    });

    // 注册时不再自动创建角色
    // 用户登录后可以认领角色或创建新角色
    const token = generateToken(user.id, false);
    return res.status(201).json({
      token,
      user: { id: user.id, username: user.username, displayName: user.displayName },
      member: null,
      isAdmin: false,
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

    // 检查是否是管理员（硬编码判断）
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // 确保管理员用户存在
      let user = await prisma.user.findUnique({ where: { username } });
      if (!user) {
        const passwordHash = await bcrypt.hash(password, 12);
        user = await prisma.user.create({
          data: { username, passwordHash, displayName: '管理员', isAdmin: true },
        });
      } else {
        // 更新为管理员
        await prisma.user.update({
          where: { id: user.id },
          data: { isAdmin: true },
        });
      }

      const token = generateToken(user.id, true);
      return res.json({
        token,
        user: { id: user.id, username: user.username, displayName: user.displayName },
        member: null,
        isAdmin: true,
      });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(401).json({ error: '用户名或密码错误' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: '用户名或密码错误' });

    const members = await prisma.member.findMany({
      where: { userId: user.id, isDisabled: false },
    });

    const token = generateToken(user.id, user.isAdmin || false);
    return res.json({
      token,
      user: { id: user.id, username: user.username, displayName: user.displayName },
      member: members.length > 0 ? members[0] : null,
      members: members.map((m: any) => ({
        id: m.id,
        displayName: m.displayName,
        wowClass: m.wowClass,
        wowClassZh: m.wowClassZh,
        tags: JSON.parse(m.tags || '[]'),
        status: m.status,
      })),
      isAdmin: user.isAdmin || false,
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
    const payload = jwt.default.verify(authHeader.split(' ')[1], JWT_SECRET) as { userId: number; isAdmin?: boolean };
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(404).json({ error: '用户不存在' });

    const members = await prisma.member.findMany({ where: { userId: user.id, isDisabled: false } });
    return res.json({
      user: { id: user.id, username: user.username, displayName: user.displayName },
      members: members.map((m: any) => ({
        id: m.id,
        displayName: m.displayName,
        wowClass: m.wowClass,
        wowClassZh: m.wowClassZh,
        tags: JSON.parse(m.tags || '[]'),
        status: m.status,
      })),
      isAdmin: user.isAdmin || false,
    });
  } catch {
    return res.status(401).json({ error: '登录已过期' });
  }
});

// GET /api/auth/users
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      displayName: true,
    },
    orderBy: {
      displayName: 'asc'
    }
  });
  return res.json(users);
});

export default router;
