import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../prisma/client';
import { requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/raid-kills — simplified: no drop count calculation
router.post(
  '/',
  requireAdmin,
  body('scheduleId').isInt(),
  body('raidId').notEmpty(),
  body('bossId').notEmpty(),
  body('bossName').notEmpty(),
  body('difficulty').isIn(['normal', 'heroic', 'mythic']),
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { scheduleId, raidId, bossId, bossName, difficulty, dropCount: overrideDropCount } = req.body;

    // Get participant count from schedule
    const schedule = await prisma.raidSchedule.findUnique({
      where: { id: scheduleId },
      include: { participants: { where: { status: 'confirmed' } } }
    });
    
    // 优先使用新版 participants 表的出勤人数，兼容旧版 participantIds
    let participantCount = 0;
    if (schedule) {
      if (schedule.participants && schedule.participants.length > 0) {
        participantCount = schedule.participants.length;
      } else if (schedule.participantIds) {
        participantCount = (JSON.parse(schedule.participantIds) as number[]).length;
      }
    }

    let finalDropCount = 0;
    if (overrideDropCount !== undefined && overrideDropCount !== null) {
      finalDropCount = overrideDropCount;
    } else {
      if (difficulty === 'mythic') {
        finalDropCount = 4;
      } else if (difficulty === 'normal' || difficulty === 'heroic') {
        finalDropCount = Math.max(1, Math.floor(participantCount / 5));
      }
    }

    const kill = await prisma.raidKill.create({
      data: {
        scheduleId,
        raidId,
        bossId,
        bossName,
        difficulty,
        participantCount,
        dropCount: finalDropCount,
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
