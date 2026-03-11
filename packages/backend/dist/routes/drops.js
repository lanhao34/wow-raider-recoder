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
// 装等计算配置
const DIFFICULTY_OFFSETS = {
    normal: -13,
    heroic: 0,
    mythic: 13,
};
// 根据难度计算实际装等
function getItemLevelForDifficulty(baseItemLevel, difficulty) {
    return baseItemLevel + (DIFFICULTY_OFFSETS[difficulty] || 0);
}
// POST /api/drops — batch, no count limit, duplicates allowed
router.post('/', auth_1.requireLeader, (0, express_validator_1.body)('raidKillId').isInt(), (0, express_validator_1.body)('items').isArray({ min: 1 }), (0, express_validator_1.body)('items.*.itemId').notEmpty(), (0, express_validator_1.body)('items.*.itemName').notEmpty(), (0, express_validator_1.body)('items.*.slot').notEmpty(), (0, express_validator_1.body)('items.*.isTier').optional().isBoolean(), (0, express_validator_1.body)('items.*.baseItemLevel').optional().isInt(), (0, express_validator_1.body)('items.*.quality').optional().isString(), (0, express_validator_1.body)('items.*.armorType').optional().isString(), async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const { raidKillId, items } = req.body;
    const kill = await client_1.default.raidKill.findUnique({ where: { id: raidKillId } });
    if (!kill)
        return res.status(404).json({ error: 'Raid kill not found' });
    // Calculate item level based on difficulty
    const difficulty = kill.difficulty;
    // No count limit — leader decides what dropped
    await client_1.default.drop.createMany({
        data: items.map((item) => {
            const baseItemLevel = item.baseItemLevel || 0;
            const itemLevel = getItemLevelForDifficulty(baseItemLevel, difficulty);
            return {
                raidKillId,
                itemId: item.itemId,
                itemName: item.itemName,
                itemLevel,
                baseItemLevel,
                slot: item.slot,
                isTier: item.isTier || false,
                bonusDrop: false,
                quality: item.quality || 'epic',
                armorType: item.armorType || null,
            };
        }),
    });
    const drops = await client_1.default.drop.findMany({
        where: { raidKillId },
        include: { distribution: { include: { member: true } } },
    });
    return res.status(201).json({ count: items.length, drops });
});
// GET /api/drops
router.get('/', auth_1.authenticate, async (req, res) => {
    const { raidKillId, memberId } = req.query;
    if (raidKillId) {
        const drops = await client_1.default.drop.findMany({
            where: { raidKillId: parseInt(raidKillId) },
            include: { distribution: { include: { member: true } } },
            orderBy: { createdAt: 'desc' },
        });
        return res.json(drops);
    }
    if (memberId) {
        const distributions = await client_1.default.distribution.findMany({
            where: { memberId: parseInt(memberId) },
            include: { drop: { include: { raidKill: { include: { schedule: true } } } } },
            orderBy: { distributedAt: 'desc' },
        });
        return res.json(distributions);
    }
    return res.status(400).json({ error: 'Query parameter required: raidKillId or memberId' });
});
// DELETE /api/drops/:id
router.delete('/:id', auth_1.requireLeader, async (req, res) => {
    const id = parseInt(req.params.id);
    await client_1.default.drop.delete({ where: { id } });
    return res.status(204).send();
});
exports.default = router;
