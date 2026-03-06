import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../prisma/client';
import { authenticate, requireLeader, AuthRequest } from '../middleware/auth';
import { getWeekId } from '../utils/weekId';

const router = Router();

// GET /api/schedules
router.get('/', authenticate, async (req, res) => {
  const { week, month } = req.query;
  const where: Record<string, unknown> = {};
  if (week) where.weekId = week;
  else if (month) where.date = { startsWith: month as string };

  const schedules = await prisma.raidSchedule.findMany({
    where,
    include: {
      raids: true,
      kills: {
        include: {
          drops: { include: { distribution: { include: { member: true } } } },
        },
      },
    },
    orderBy: { date: 'desc' },
  });
  return res.json(schedules);
});

// POST /api/schedules
router.post(
  '/',
  requireLeader,
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/),
  body('note').optional().isString(),
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { date, note } = req.body;
    const weekId = getWeekId(new Date(date));

    const existing = await prisma.raidSchedule.findFirst({ where: { date } });
    if (existing) return res.status(400).json({ error: 'Schedule already exists for this date' });

    const schedule = await prisma.raidSchedule.create({
      data: { date, weekId, note, createdBy: req.userId!, participantIds: '[]' },
      include: { raids: true, kills: { include: { drops: true } } },
    });
    return res.status(201).json(schedule);
  }
);

// GET /api/schedules/:id
router.get('/:id', authenticate, async (req, res) => {
  const id = parseInt(req.params.id);
  const schedule = await prisma.raidSchedule.findUnique({
    where: { id },
    include: {
      raids: true,
      kills: {
        include: {
          drops: {
            include: { distribution: { include: { member: true } } },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
  return res.json(schedule);
});

// PUT /api/schedules/:id/participants — update participant member IDs
router.put(
  '/:id/participants',
  requireLeader,
  body('memberIds').isArray(),
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const id = parseInt(req.params.id);
    const { memberIds } = req.body;
    const schedule = await prisma.raidSchedule.update({
      where: { id },
      data: { participantIds: JSON.stringify(memberIds) },
    });
    return res.json({ participantIds: JSON.parse(schedule.participantIds) });
  }
);

// POST /api/schedules/:id/raids
router.post(
  '/:id/raids',
  requireLeader,
  body('raidId').notEmpty(),
  body('raidName').notEmpty(),
  body('difficulty').isIn(['normal', 'heroic', 'mythic']),
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const scheduleId = parseInt(req.params.id);
    const { raidId, raidName, difficulty } = req.body;

    const scheduleRaid = await prisma.scheduleRaid.upsert({
      where: { scheduleId_raidId_difficulty: { scheduleId, raidId, difficulty } },
      update: {},
      create: { scheduleId, raidId, raidName, difficulty },
    });
    return res.status(201).json(scheduleRaid);
  }
);

// DELETE /api/schedules/:id/raids/:raidRecordId
router.delete('/:id/raids/:raidRecordId', requireLeader, async (req, res) => {
  const raidRecordId = parseInt(req.params.raidRecordId);
  await prisma.scheduleRaid.delete({ where: { id: raidRecordId } });
  return res.status(204).send();
});

export default router;
