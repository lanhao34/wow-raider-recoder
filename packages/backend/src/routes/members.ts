import { Router } from 'express';
import prisma from '../prisma/client';
import { authenticate, AuthRequest, requireLeader } from '../middleware/auth';

const router = Router();

// GET /api/members - 获取所有成员
router.get('/', authenticate, async (req: AuthRequest, res) => {
  const members = await prisma.member.findMany({
    include: {
      user: {
        select: {
          username: true,
          isSuperAdmin: true,
        },
      },
    },
    orderBy: {
      displayName: 'asc',
    },
  });
  
  res.json(members.map(m => ({
    id: m.id,
    displayName: m.displayName,
    wowClass: m.wowClass,
    wowClassZh: m.wowClassZh,
    isLeader: m.isLeader,
    status: m.status,
    userId: m.userId,
    username: m.user?.username || null,
    isSuperAdmin: m.user?.isSuperAdmin || false,
  })));
});

// POST /api/members - 创建新成员
router.post('/', requireLeader, async (req: AuthRequest, res) => {
  const { displayName, wowClass, wowClassZh, isLeader, status, userId } = req.body;
  
  // 如果没有指定 userId，使用当前用户的 ID
  const targetUserId = userId || req.userId;
  
  const member = await prisma.member.create({
    data: {
      displayName,
      wowClass,
      wowClassZh,
      isLeader: isLeader || false,
      status: status || 'active',
      userId: targetUserId!,
    },
  });
  
  res.status(201).json(member);
});

// PUT /api/members/:id - 更新成员
router.put('/:id', requireLeader, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const { displayName, wowClass, wowClassZh, isLeader, status } = req.body;
  
  const member = await prisma.member.update({
    where: { id },
    data: {
      displayName,
      wowClass,
      wowClassZh,
      isLeader,
      status,
    },
  });
  
  res.json(member);
});

// DELETE /api/members/:id - 删除成员
// 团长可以删除普通团员角色，超管可以删除任何角色
router.delete('/:id', requireLeader, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  
  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          isSuperAdmin: true,
        },
      },
    },
  });
  
  if (!member) {
    return res.status(404).json({ error: '角色不存在' });
  }
  
  // 检查权限
  // 超管可以删除任何角色
  if (req.isSuperAdmin) {
    await prisma.member.delete({ where: { id } });
    return res.json({ success: true });
  }
  
  // 团长只能删除普通团员角色
  if (member.isLeader) {
    return res.status(403).json({ error: '不能删除团长角色' });
  }
  
  // 不能删除超管用户
  if (member.user?.isSuperAdmin) {
    return res.status(403).json({ error: '不能删除超级管理员角色' });
  }
  
  await prisma.member.delete({ where: { id } });
  res.json({ success: true });
});

// PUT /api/members/:id/leader - 任命/撤销团长
// 只有超管可以操作
router.put('/:id/leader', authenticate, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const { isLeader } = req.body;
  
  // 只有超管可以任命团长
  if (!req.isSuperAdmin) {
    return res.status(403).json({ error: '只有超级管理员可以任命团长' });
  }
  
  const member = await prisma.member.update({
    where: { id },
    data: { isLeader },
  });
  
  // 如果是任命团长，同时更新该用户的所有角色为团长
  if (isLeader) {
    await prisma.member.updateMany({
      where: { userId: member.userId },
      data: { isLeader: true },
    });
  }
  
  res.json(member);
});

export default router;
