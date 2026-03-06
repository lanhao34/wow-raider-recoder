import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../prisma/client';
import { authenticate, requireLeader, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/members
router.get('/', authenticate, async (_req, res) => {
  const members = await prisma.member.findMany({
    orderBy: [{ isLeader: 'desc' }, { displayName: 'asc' }],
  });
  return res.json(members);
});

// POST /api/members (leader only)
router.post(
  '/',
  requireLeader,
  body('displayName').isLength({ min: 1, max: 50 }).trim(),
  body('wowClass').notEmpty(),
  body('wowClassZh').notEmpty(),
  body('isLeader').optional().isBoolean(),
  body('status').optional().isIn(['active', 'backup', 'inactive']),
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { displayName, wowClass, wowClassZh, isLeader = false, status = 'active', userId } = req.body;
    const member = await prisma.member.create({
      data: { displayName, wowClass, wowClassZh, isLeader, status, userId: userId || null },
    });
    return res.status(201).json(member);
  }
);

// PUT /api/members/:id (leader only)
router.put(
  '/:id',
  requireLeader,
  body('displayName').optional().isLength({ min: 1, max: 50 }).trim(),
  body('wowClass').optional().notEmpty(),
  body('isLeader').optional().isBoolean(),
  body('status').optional().isIn(['active', 'backup', 'inactive']),
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const id = parseInt(req.params.id);
    const { displayName, wowClass, wowClassZh, isLeader, status, userId } = req.body;

    const member = await prisma.member.update({
      where: { id },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(wowClass !== undefined && { wowClass }),
        ...(wowClassZh !== undefined && { wowClassZh }),
        ...(isLeader !== undefined && { isLeader }),
        ...(status !== undefined && { status }),
        ...(userId !== undefined && { userId }),
      },
    });
    return res.json(member);
  }
);

// DELETE /api/members/:id (leader only)
router.delete('/:id', requireLeader, async (req, res) => {
  const id = parseInt(req.params.id);
  await prisma.member.delete({ where: { id } });
  return res.status(204).send();
});

// GET /api/members/:id/tier-progress
router.get('/:id/tier-progress', authenticate, async (req, res) => {
  const id = parseInt(req.params.id);
  const tierSlots = ['head', 'shoulder', 'chest', 'hands', 'legs'];

  const distributions = await prisma.distribution.findMany({
    where: { memberId: id },
    include: { drop: true },
  });

  const tierProgress: Record<string, boolean> = {};
  for (const slot of tierSlots) {
    tierProgress[slot] = distributions.some(d => d.drop.isTier && d.drop.slot === slot);
  }

  return res.json({
    memberId: id,
    ...tierProgress,
    count: Object.values(tierProgress).filter(Boolean).length,
  });
});

export default router;
