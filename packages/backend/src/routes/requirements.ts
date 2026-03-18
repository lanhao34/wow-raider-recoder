import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/requirements?memberId=
router.get('/', authenticate, async (req, res) => {
  const { memberId } = req.query;
  const requirements = await prisma.requirement.findMany({
    where: memberId ? { memberId: parseInt(memberId as string) } : undefined,
    include: { member: true },
    orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
  });
  return res.json(requirements);
});

// POST /api/requirements
router.post(
  '/',
  authenticate,
  body('itemId').notEmpty(),
  body('itemName').notEmpty(),
  body('priority').isIn(['bis', 'high', 'medium', 'low']),
  body('note').optional().isString(),
  body('memberId').optional().isInt(),
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { itemId, itemName, priority, note, memberId } = req.body;

    // Find member linked to current user
    const member = await prisma.member.findFirst({ 
      where: memberId 
        ? { id: memberId, userId: req.userId } // 如果指定了 memberId，验证属于当前用户
        : { userId: req.userId } // 否则使用第一个角色
    });
    
    if (!member) {
      return res.status(403).json({ 
        error: '请先创建或认领角色，然后才能登记装备需求',
        code: 'NO_MEMBER'
      });
    }

    const requirement = await prisma.requirement.upsert({
      where: { memberId_itemId: { memberId: member.id, itemId } },
      update: { priority, note },
      create: { memberId: member.id, itemId, itemName, priority, note },
      include: { member: true },
    });
    return res.status(201).json(requirement);
  }
);

// DELETE /api/requirements/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const requirement = await prisma.requirement.findUnique({
    where: { id },
    include: { member: true },
  });
  if (!requirement) return res.status(404).json({ error: 'Not found' });

  // Only member themselves or leader can delete
  const member = await prisma.member.findFirst({ where: { userId: req.userId } });
  if (!member) return res.status(403).json({ error: 'Forbidden' });
  
  // Check if user is leader (admin)
  const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { isAdmin: true } });
  if (requirement.memberId !== member.id && !user?.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await prisma.requirement.delete({ where: { id } });
  return res.status(204).send();
});

// GET /api/requirements/tier-progress — all members tier tracking
router.get('/tier-progress', authenticate, async (_req, res) => {
  const tierSlots = ['head', 'shoulder', 'chest', 'hands', 'legs'];
  const members = await prisma.member.findMany({
    where: { status: 'active' },
    orderBy: { displayName: 'asc' },
  });

  const allDistributions = await prisma.distribution.findMany({
    where: { drop: { isTier: true } },
    include: { drop: true },
  });

  const progress = members.map(member => {
    const memberDist = allDistributions.filter(d => d.memberId === member.id);
    const slots: Record<string, boolean> = {};
    for (const slot of tierSlots) {
      slots[slot] = memberDist.some(d => d.drop.slot === slot);
    }
    return {
      memberId: member.id,
      memberName: member.displayName,
      wowClass: member.wowClass,
      ...slots,
      count: Object.values(slots).filter(Boolean).length,
    };
  });

  return res.json(progress);
});

export default router;
