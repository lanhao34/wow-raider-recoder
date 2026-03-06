"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const client_1 = __importDefault(require("../prisma/client"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// POST /api/distributions
router.post('/', auth_1.requireLeader, (0, express_validator_1.body)('dropId').isInt(), (0, express_validator_1.body)('memberId').isInt(), (0, express_validator_1.body)('status').optional().isIn(['assigned', 'received']), async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const { dropId, memberId, status = 'assigned' } = req.body;
    // Check drop exists
    const drop = await client_1.default.drop.findUnique({ where: { id: dropId } });
    if (!drop)
        return res.status(404).json({ error: 'Drop not found' });
    // Check not already distributed
    const existing = await client_1.default.distribution.findUnique({ where: { dropId } });
    if (existing)
        return res.status(400).json({ error: 'Drop already distributed' });
    const distribution = await client_1.default.distribution.create({
        data: { dropId, memberId, distributedBy: req.userId, status },
        include: { member: true, drop: true },
    });
    return res.status(201).json(distribution);
});
// GET /api/distributions?memberId=&week=
router.get('/', auth_1.authenticate, async (req, res) => {
    const { memberId, week } = req.query;
    const where = {};
    if (memberId)
        where.memberId = parseInt(memberId);
    let distributions;
    if (week) {
        distributions = await client_1.default.distribution.findMany({
            where: {
                ...where,
                drop: {
                    raidKill: {
                        schedule: { weekId: week },
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
    }
    else {
        distributions = await client_1.default.distribution.findMany({
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
router.put('/:id', auth_1.requireLeader, (0, express_validator_1.body)('status').isIn(['assigned', 'received']), async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const id = parseInt(req.params.id);
    const distribution = await client_1.default.distribution.update({
        where: { id },
        data: { status: req.body.status },
        include: { member: true, drop: true },
    });
    return res.json(distribution);
});
// DELETE /api/distributions/:id (leader only)
router.delete('/:id', auth_1.requireLeader, async (req, res) => {
    const id = parseInt(req.params.id);
    await client_1.default.distribution.delete({ where: { id } });
    return res.status(204).send();
});
exports.default = router;
