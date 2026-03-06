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
// POST /api/raid-kills — simplified: no drop count calculation
router.post('/', auth_1.requireLeader, (0, express_validator_1.body)('scheduleId').isInt(), (0, express_validator_1.body)('raidId').notEmpty(), (0, express_validator_1.body)('bossId').notEmpty(), (0, express_validator_1.body)('bossName').notEmpty(), (0, express_validator_1.body)('difficulty').isIn(['normal', 'heroic', 'mythic']), async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const { scheduleId, raidId, bossId, bossName, difficulty } = req.body;
    // Get participant count from schedule
    const schedule = await client_1.default.raidSchedule.findUnique({ where: { id: scheduleId } });
    const participantCount = schedule
        ? JSON.parse(schedule.participantIds).length
        : 0;
    const kill = await client_1.default.raidKill.create({
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
});
// GET /api/raid-kills/:id
router.get('/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const kill = await client_1.default.raidKill.findUnique({
        where: { id },
        include: {
            drops: { include: { distribution: { include: { member: true } } } },
        },
    });
    if (!kill)
        return res.status(404).json({ error: 'Raid kill not found' });
    return res.json(kill);
});
exports.default = router;
