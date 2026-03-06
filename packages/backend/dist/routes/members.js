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
// GET /api/members
router.get('/', auth_1.authenticate, async (_req, res) => {
    const members = await client_1.default.member.findMany({
        orderBy: [{ isLeader: 'desc' }, { displayName: 'asc' }],
    });
    return res.json(members);
});
// POST /api/members (leader only)
router.post('/', auth_1.requireLeader, (0, express_validator_1.body)('displayName').isLength({ min: 1, max: 50 }).trim(), (0, express_validator_1.body)('wowClass').notEmpty(), (0, express_validator_1.body)('wowClassZh').notEmpty(), (0, express_validator_1.body)('isLeader').optional().isBoolean(), (0, express_validator_1.body)('status').optional().isIn(['active', 'backup', 'inactive']), async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const { displayName, wowClass, wowClassZh, isLeader = false, status = 'active', userId } = req.body;
    const member = await client_1.default.member.create({
        data: { displayName, wowClass, wowClassZh, isLeader, status, userId: userId || null },
    });
    return res.status(201).json(member);
});
// PUT /api/members/:id (leader only)
router.put('/:id', auth_1.requireLeader, (0, express_validator_1.body)('displayName').optional().isLength({ min: 1, max: 50 }).trim(), (0, express_validator_1.body)('wowClass').optional().notEmpty(), (0, express_validator_1.body)('isLeader').optional().isBoolean(), (0, express_validator_1.body)('status').optional().isIn(['active', 'backup', 'inactive']), async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const id = parseInt(req.params.id);
    const { displayName, wowClass, wowClassZh, isLeader, status, userId } = req.body;
    const member = await client_1.default.member.update({
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
});
// DELETE /api/members/:id (leader only)
router.delete('/:id', auth_1.requireLeader, async (req, res) => {
    const id = parseInt(req.params.id);
    await client_1.default.member.delete({ where: { id } });
    return res.status(204).send();
});
// GET /api/members/:id/tier-progress
router.get('/:id/tier-progress', auth_1.authenticate, async (req, res) => {
    const id = parseInt(req.params.id);
    const tierSlots = ['head', 'shoulder', 'chest', 'hands', 'legs'];
    const distributions = await client_1.default.distribution.findMany({
        where: { memberId: id },
        include: { drop: true },
    });
    const tierProgress = {};
    for (const slot of tierSlots) {
        tierProgress[slot] = distributions.some(d => d.drop.isTier && d.drop.slot === slot);
    }
    return res.json({
        memberId: id,
        ...tierProgress,
        count: Object.values(tierProgress).filter(Boolean).length,
    });
});
exports.default = router;
