import { Router } from 'express';
import prisma from '../prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/claims/available - 获取可认领的角色列表（未关联用户的角色）
router.get('/available', authenticate, async (req: AuthRequest, res) => {
  const unclaimedMembers = await prisma.member.findMany({
    where: {
      userId: null,
    },
    orderBy: {
      displayName: 'asc',
    },
  });
  
  res.json(unclaimedMembers);
});

// POST /api/claims/request - 直接认领角色
router.post('/request', authenticate, async (req: AuthRequest, res) => {
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
  
  if (member.userId !== null) {
    return res.status(400).json({ error: '该角色已被认领' });
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
