import { Router, Request } from 'express';
import prisma from '../prisma/client';
import { authenticate, AuthRequest, requireAdmin } from '../middleware/auth';

const router = Router();

// GET /api/members - 获取所有成员（管理员可见）
router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const members = await prisma.member.findMany({
    include: {
      user: {
        select: {
          username: true,
          isAdmin: true,
        },
      },
    },
    orderBy: {
      displayName: 'asc',
    },
  });
  
  res.json(members.map((m: any) => ({
    id: m.id,
    displayName: m.displayName,
    wowClass: m.wowClass,
    wowClassZh: m.wowClassZh,
    status: m.status,
    userId: m.userId,
    username: m.user?.username || null,
    isAdmin: m.user?.isAdmin || false,
  })));
});

// GET /api/members/my - 获取当前用户自己的角色
router.get('/my', authenticate, async (req: AuthRequest, res) => {
  const members = await prisma.member.findMany({
    where: {
      userId: req.userId,
    },
    select: {
      id: true,
      displayName: true,
      wowClass: true,
      wowClassZh: true,
      status: true,
      source: true,
    },
    orderBy: {
      displayName: 'asc',
    },
  });
  
  res.json(members);
});

// GET /api/members/public - 获取活跃成员列表（公开，用于报名）
router.get('/public', authenticate, async (req: AuthRequest, res) => {
  const members = await prisma.member.findMany({
    where: {
      isDisabled: false,
      status: { in: ['active', 'backup'] },
    },
    select: {
      id: true,
      displayName: true,
      wowClass: true,
      wowClassZh: true,
      status: true,
    },
    orderBy: {
      displayName: 'asc',
    },
  });
  
  res.json(members);
});

// GET /api/members/stats - 获取所有成员的统计信息（管理员可见）
router.get('/stats', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const members = await prisma.member.findMany({
    include: {
      user: {
        select: {
          username: true,
          isAdmin: true,
        },
      },
      requirements: {
        select: {
          id: true,
          itemId: true,
          itemName: true,
          priority: true,
        },
      },
      distributions: {
        select: {
          id: true,
          distributedAt: true,
          drop: {
            select: {
              itemId: true,
              itemName: true,
              itemLevel: true,
            },
          },
        },
      },
    },
  });

  // 统计活动参与次数（从 RaidSchedule 的 participantIds 中统计）
  const allSchedules = await prisma.raidSchedule.findMany({
    select: {
      id: true,
      participantIds: true,
    },
  });

  const stats = members.map((member: any) => {
    // 统计活动参与次数
    const participationCount = allSchedules.filter((s: any) => {
      const participantIds = JSON.parse(s.participantIds) as number[];
      return participantIds.includes(member.id);
    }).length;

    // 统计装备获取
    const itemsReceived = member.distributions.map((d: any) => ({
      itemId: d.drop.itemId,
      itemName: d.drop.itemName,
      itemLevel: d.drop.itemLevel,
      distributedAt: d.distributedAt,
    }));

    return {
      id: member.id,
      displayName: member.displayName,
      wowClass: member.wowClass,
      wowClassZh: member.wowClassZh,
      status: member.status,
      userId: member.userId,
      username: member.user?.username || null,
      isAdmin: member.user?.isAdmin || false,
      stats: {
        participationCount,
        itemsReceivedCount: itemsReceived.length,
        itemsReceived,
        requirementsCount: member.requirements.length,
        requirements: member.requirements,
      },
    };
  });

  res.json(stats);
});

// GET /api/members/:id/stats - 获取单个成员的统计信息
router.get('/:id/stats', authenticate, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  
  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          username: true,
          isAdmin: true,
        },
      },
      requirements: {
        select: {
          id: true,
          itemId: true,
          itemName: true,
          priority: true,
        },
      },
      distributions: {
        select: {
          id: true,
          distributedAt: true,
          drop: {
            select: {
              itemId: true,
              itemName: true,
              itemLevel: true,
            },
          },
        },
      },
    },
  });

  if (!member) {
    return res.status(404).json({ error: '角色不存在' });
  }

  // 统计活动参与次数
  const allSchedules = await prisma.raidSchedule.findMany({
    select: {
      id: true,
      participantIds: true,
    },
  });

  const participationCount = allSchedules.filter((s: any) => {
    const participantIds = JSON.parse(s.participantIds) as number[];
    return participantIds.includes(member.id);
  }).length;

  const itemsReceived = member.distributions.map((d: any) => ({
    itemId: d.drop.itemId,
    itemName: d.drop.itemName,
    itemLevel: d.drop.itemLevel,
    distributedAt: d.distributedAt,
  }));

  res.json({
    id: member.id,
    displayName: member.displayName,
    wowClass: member.wowClass,
    wowClassZh: member.wowClassZh,
    status: member.status,
    userId: member.userId,
    username: member.user?.username || null,
    isAdmin: member.user?.isAdmin || false,
    stats: {
      participationCount,
      itemsReceivedCount: itemsReceived.length,
      itemsReceived,
      requirementsCount: member.requirements.length,
      requirements: member.requirements,
    },
  });
});

// POST /api/members - 创建新成员
// - 普通用户：只能给自己创建角色（自动绑定）
// - 管理员/超管：可以创建未绑定角色（供认领）或指定绑定用户
router.post('/', authenticate, async (req: AuthRequest, res) => {
  const { displayName, wowClass, wowClassZh, status, userId, bindToSelf } = req.body;
  
  let targetUserId: number | null = null;
  let source: 'claimed' | 'created' = 'created';
  
  // 普通用户只能给自己创建角色
  if (!req.isAdmin) {
    targetUserId = req.userId!;
  } else {
    // 管理员/超管可以创建未绑定角色
    if (userId !== undefined && userId !== null) {
      // 明确指定了 userId，绑定到该用户
      targetUserId = userId;
    } else if (bindToSelf === true) {
      // 明确要求自己绑定
      targetUserId = req.userId!;
    } else {
      // 默认绑定给该管理员，代替原来的 null
      targetUserId = req.userId!;
      source = 'created';
    }
  }
  
  const member = await prisma.member.create({
    data: {
      displayName,
      wowClass,
      wowClassZh,
      status: status || 'active',
      userId: targetUserId,
      source,
    },
  });
  
  res.status(201).json(member);
});

// PUT /api/members/:id - 更新成员（管理员可见）
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const { displayName, wowClass, wowClassZh, status, userId } = req.body;
  
  const updateData: any = {
    displayName,
    wowClass,
    wowClassZh,
    status,
  };
  
  console.log(`[UPDATE Member ${id}] req.body.userId:`, userId, typeof userId);

  if (userId !== undefined) {
    if (userId === null) {
      updateData.user = { disconnect: true };
      updateData.source = 'created';
      console.log(`[UPDATE Member ${id}] applying disconnect for user relation`);
    } else {
      updateData.userId = userId;
      updateData.source = 'claimed';
    }
  }

  const member = await prisma.member.update({
    where: { id },
    data: updateData,
  });
  
  res.json(member);
});

// DELETE /api/members/:id - 删除成员（管理员或归属用户操作）
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  
  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      raidParticipants: true,
      distributions: true,
      user: {
        select: {
          isAdmin: true,
        },
      },
    },
  });
  
  if (!member) {
    return res.status(404).json({ error: '角色不存在' });
  }

  // 1. Permission check: Overlord/Admin or Self
  if (!req.isAdmin && member.userId !== req.userId) {
    return res.status(403).json({ error: '无权操作此角色' });
  }
  
  // 管理员不能删除超级管理员的角色（除非是管理自己的角色）
  if (req.isAdmin && member.user?.isAdmin && req.userId !== member.userId) {
    return res.status(403).json({ error: '不能删除超级管理员的角色' });
  }

  // 2. Dependency check (Data Safety)
  if (member.raidParticipants.length > 0 || member.distributions.length > 0) {
    return res.status(400).json({ error: '该角色已有团队活动记录，为保护历史数据禁止硬删除。建议使用该角色的“退回/解除绑定”功能或将其状态修改为非活跃归档。' });
  }
  
  await prisma.member.delete({ where: { id } });
  res.json({ success: true, message: '删除成功' });
});

// PUT /api/members/:id/set-admin - 指定/取消管理员（仅超管）
router.put('/:id/set-admin', authenticate, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const { isAdmin } = req.body;
  
  // 只有超管可以指定管理员
  if (!req.isAdmin) {
    return res.status(403).json({ error: '只有超级管理员可以指定管理员' });
  }
  
  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      user: true,
    },
  });
  
  if (!member) {
    return res.status(404).json({ error: '角色不存在' });
  }
  
  if (!member.userId) {
    return res.status(400).json({ error: '该角色未关联用户' });
  }
  
  // 更新 User 的 isAdmin 字段
  await prisma.user.update({
    where: { id: member.userId },
    data: { isAdmin },
  });
  
  res.json({
    success: true,
    message: isAdmin ? '已指定为管理员' : '已取消管理员权限',
  });
});

export default router;
