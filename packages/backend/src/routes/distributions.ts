import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../prisma/client';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/distributions
router.post(
  '/',
  requireAdmin,
  body('dropId').isInt(),
  body('memberId').isInt(),
  body('status').optional().isIn(['assigned', 'received']),
  body('method').optional().isIn(['need', 'greed', 'force']),
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { dropId, memberId, status = 'assigned', method = 'need' } = req.body;

    // Check drop exists
    const drop = await prisma.drop.findUnique({ where: { id: dropId } });
    if (!drop) return res.status(404).json({ error: 'Drop not found' });

    // Check not already distributed
    const existing = await prisma.distribution.findUnique({ where: { dropId } });
    if (existing) return res.status(400).json({ error: 'Drop already distributed' });

    const distribution = await prisma.distribution.create({
      data: { dropId, memberId, distributedBy: req.userId!, status, method },
      include: { member: true, drop: true },
    });
    return res.status(201).json(distribution);
  }
);

// GET /api/distributions?memberId=&week=
router.get('/', authenticate, async (req, res) => {
  const { memberId, week } = req.query;

  const where: Record<string, unknown> = {};
  if (memberId) where.memberId = parseInt(memberId as string);

  let distributions;
  if (week) {
    distributions = await prisma.distribution.findMany({
      where: {
        ...where,
        drop: {
          raidKill: {
            schedule: { weekId: week as string },
          },
        },
      },
      include: {
        member: true,
        drop: {
          include: {
            raidKill: { include: { schedule: true } },
          },
        },
      },
      orderBy: { distributedAt: 'desc' },
    });
  } else {
    distributions = await prisma.distribution.findMany({
      where,
      include: {
        member: true,
        drop: {
          include: {
            raidKill: { include: { schedule: true } },
          },
        },
      },
      orderBy: { distributedAt: 'desc' },
    });
  }

  return res.json(distributions);
});

// PUT /api/distributions/:id (update status)
router.put(
  '/:id',
  requireAdmin,
  body('status').optional().isIn(['assigned', 'received']),
  body('method').optional().isIn(['need', 'greed', 'force']),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const id = parseInt(req.params.id);
    const dataToUpdate: any = {};
    if (req.body.status) dataToUpdate.status = req.body.status;
    if (req.body.method) dataToUpdate.method = req.body.method;

    const distribution = await prisma.distribution.update({
      where: { id },
      data: dataToUpdate,
      include: { member: true, drop: true },
    });
    return res.json(distribution);
  }
);

// DELETE /api/distributions/:id (leader only)
router.delete('/:id', requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  await prisma.distribution.delete({ where: { id } });
  return res.status(204).send();
});

export default router;
