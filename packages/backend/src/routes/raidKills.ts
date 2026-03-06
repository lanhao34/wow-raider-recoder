import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../prisma/client';
import { requireLeader, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/raid-kills — simplified: no drop count calculation
router.post(
  '/',
  requireLeader,
  body('scheduleId').isInt(),
  body('raidId').notEmpty(),
  body('bossId').notEmpty(),
  body('bossName').notEmpty(),
  body('difficulty').isIn(['normal', 'heroic', 'mythic']),
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { scheduleId, raidId, bossId, bossName, difficulty } = req.body;

    // Get participant count from schedule
    const schedule = await prisma.raidSchedule.findUnique({ where: { id: scheduleId } });
    const participantCount = schedule
      ? (JSON.parse(schedule.participantIds) as number[]).length
      : 0;

    const kill = await prisma.raidKill.create({
      data: {
        scheduleId,
        raidId,
        bossId,
        bossName,
        difficulty,
        participantCount,
        dropCount: 0, // 0 = unlimited, leader manually selects
      },
      include: {
        drops: { include: { distribution: { include: { member: true } } } },
      },
    });
    return res.status(201).json(kill);
  }
);

// GET /api/raid-kills/:id
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const kill = await prisma.raidKill.findUnique({
    where: { id },
    include: {
      drops: { include: { distribution: { include: { member: true } } } },
    },
  });
  if (!kill) return res.status(404).json({ error: 'Raid kill not found' });
  return res.json(kill);
});

export default router;
