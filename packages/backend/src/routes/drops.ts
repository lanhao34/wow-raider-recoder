import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../prisma/client';
import { authenticate, requireLeader, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/drops — batch, no count limit, duplicates allowed
router.post(
  '/',
  requireLeader,
  body('raidKillId').isInt(),
  body('items').isArray({ min: 1 }),
  body('items.*.itemId').notEmpty(),
  body('items.*.itemName').notEmpty(),
  body('items.*.slot').notEmpty(),
  body('items.*.isTier').optional().isBoolean(),
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { raidKillId, items } = req.body;

    const kill = await prisma.raidKill.findUnique({ where: { id: raidKillId } });
    if (!kill) return res.status(404).json({ error: 'Raid kill not found' });

    // No count limit — leader decides what dropped
    await prisma.drop.createMany({
      data: items.map((item: { itemId: string; itemName: string; slot: string; isTier?: boolean }) => ({
        raidKillId,
        itemId: item.itemId,
        itemName: item.itemName,
        slot: item.slot,
        isTier: item.isTier || false,
        bonusDrop: false,
      })),
    });

    const drops = await prisma.drop.findMany({
      where: { raidKillId },
      include: { distribution: { include: { member: true } } },
    });
    return res.status(201).json({ count: items.length, drops });
  }
);

// GET /api/drops
router.get('/', authenticate, async (req, res) => {
  const { raidKillId, memberId } = req.query;

  if (raidKillId) {
    const drops = await prisma.drop.findMany({
      where: { raidKillId: parseInt(raidKillId as string) },
      include: { distribution: { include: { member: true } } },
    });
    return res.json(drops);
  }
  if (memberId) {
    const distributions = await prisma.distribution.findMany({
      where: { memberId: parseInt(memberId as string) },
      include: { drop: { include: { raidKill: { include: { schedule: true } } } } },
    });
    return res.json(distributions);
  }
  return res.status(400).json({ error: 'Query parameter required: raidKillId or memberId' });
});

// DELETE /api/drops/:id
router.delete('/:id', requireLeader, async (req, res) => {
  const id = parseInt(req.params.id);
  await prisma.drop.delete({ where: { id } });
  return res.status(204).send();
});

export default router;
