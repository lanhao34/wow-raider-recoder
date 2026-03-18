import { Router } from 'express';
import prisma from '../prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/claims/available - 获取可认领的角色列表（归属于任何管理员的角色）
router.get('/available', authenticate, async (req: AuthRequest, res) => {
  const unclaimedMembers = await prisma.member.findMany({
    where: {
      user: {
        isAdmin: true,
      },
    },
    orderBy: {
      displayName: 'asc',
    },
    include: {
      user: {
        select: { isAdmin: true },
      },
    },
  });
  
  res.json(unclaimedMembers);
});

// POST /api/claims/return - 退回角色给管理员
router.post('/return', authenticate, async (req: AuthRequest, res) => {
  const { memberId } = req.body;
  
  if (!memberId) {
    return res.status(400).json({ error: '缺少角色 ID' });
  }
  
  const member = await prisma.member.findUnique({
    where: { id: memberId },
  });
  
  if (!member) {
    return res.status(404).json({ error: '角色不存在' });
  }
  
  if (member.userId !== req.userId && !req.isAdmin) {
    return res.status(403).json({ error: '只能退回自己的角色' });
  }

  // 查出系统中的任意一个管理员（通常取第一个）将角色退回给他
  const adminUser = await prisma.user.findFirst({
    where: { isAdmin: true },
    orderBy: { id: 'asc' },
  });

  if (!adminUser) {
    return res.status(500).json({ error: '系统缺少管理员接收该角色' });
  }
  
  await prisma.member.update({
    where: { id: memberId },
    data: {
      userId: adminUser.id,
      source: 'created', // 退回后重置为 created
    },
  });
  
  res.json({
    success: true,
    message: '角色退回成功',
  });
});

// POST /api/claims/request - 直接认领角色
router.post('/request', authenticate, async (req: AuthRequest, res) => {
  const { memberId } = req.body;
  
  if (!memberId) {
    return res.status(400).json({ error: '缺少角色 ID' });
  }
  
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      user: true,
    },
  });
  
  if (!member) {
    return res.status(404).json({ error: '角色不存在' });
  }
  
  // 必须属于管理员才算待认领，如果已经属于普通用户则不让认领
  if (member.user && !member.user.isAdmin) {
    return res.status(400).json({ error: '该角色已被其他用户认领' });
  }
  
  // 直接关联用户到角色
  await prisma.member.update({
    where: { id: memberId },
    data: {
      userId: req.userId,
      source: 'claimed',
    },
  });
  
  res.json({
    success: true,
    message: '角色认领成功',
  });
});

export default router;
