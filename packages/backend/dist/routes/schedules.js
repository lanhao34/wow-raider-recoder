"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const client_1 = __importDefault(require("../prisma/client"));
const auth_1 = require("../middleware/auth");
const weekId_1 = require("../utils/weekId");
const router = (0, express_1.Router)();
// GET /api/schedules
router.get('/', auth_1.authenticate, async (req, res) => {
    const { week, month } = req.query;
    const where = {};
    if (week)
        where.weekId = week;
    else if (month)
        where.date = { startsWith: month };
    const schedules = await client_1.default.raidSchedule.findMany({
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
router.post('/', auth_1.requireLeader, (0, express_validator_1.body)('date').matches(/^\d{4}-\d{2}-\d{2}$/), (0, express_validator_1.body)('note').optional().isString(), async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const { date, note } = req.body;
    const weekId = (0, weekId_1.getWeekId)(new Date(date));
    const existing = await client_1.default.raidSchedule.findFirst({ where: { date } });
    if (existing)
        return res.status(400).json({ error: 'Schedule already exists for this date' });
    const schedule = await client_1.default.raidSchedule.create({
        data: { date, weekId, note, createdBy: req.userId, participantIds: '[]' },
        include: { raids: true, kills: { include: { drops: true } } },
    });
    return res.status(201).json(schedule);
});
// GET /api/schedules/:id
router.get('/:id', auth_1.authenticate, async (req, res) => {
    const id = parseInt(req.params.id);
    const schedule = await client_1.default.raidSchedule.findUnique({
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
    if (!schedule)
        return res.status(404).json({ error: 'Schedule not found' });
    return res.json(schedule);
});
// PUT /api/schedules/:id/participants — update participant member IDs
router.put('/:id/participants', auth_1.requireLeader, (0, express_validator_1.body)('memberIds').isArray(), async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const id = parseInt(req.params.id);
    const { memberIds } = req.body;
    const schedule = await client_1.default.raidSchedule.update({
        where: { id },
        data: { participantIds: JSON.stringify(memberIds) },
    });
    return res.json({ participantIds: JSON.parse(schedule.participantIds) });
});
// POST /api/schedules/:id/raids
router.post('/:id/raids', auth_1.requireLeader, (0, express_validator_1.body)('raidId').notEmpty(), (0, express_validator_1.body)('raidName').notEmpty(), (0, express_validator_1.body)('difficulty').isIn(['normal', 'heroic', 'mythic']), async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const scheduleId = parseInt(req.params.id);
    const { raidId, raidName, difficulty } = req.body;
    const scheduleRaid = await client_1.default.scheduleRaid.upsert({
        where: { scheduleId_raidId_difficulty: { scheduleId, raidId, difficulty } },
        update: {},
        create: { scheduleId, raidId, raidName, difficulty },
    });
    return res.status(201).json(scheduleRaid);
});
// DELETE /api/schedules/:id/raids/:raidRecordId
router.delete('/:id/raids/:raidRecordId', auth_1.requireLeader, async (req, res) => {
    const raidRecordId = parseInt(req.params.raidRecordId);
    await client_1.default.scheduleRaid.delete({ where: { id: raidRecordId } });
    return res.status(204).send();
});
exports.default = router;
