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
// GET /api/requirements?memberId=
router.get('/', auth_1.authenticate, async (req, res) => {
    const { memberId } = req.query;
    const requirements = await client_1.default.requirement.findMany({
        where: memberId ? { memberId: parseInt(memberId) } : undefined,
        include: { member: true },
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });
    return res.json(requirements);
});
// POST /api/requirements
router.post('/', auth_1.authenticate, (0, express_validator_1.body)('itemId').notEmpty(), (0, express_validator_1.body)('itemName').notEmpty(), (0, express_validator_1.body)('priority').isIn(['bis', 'high', 'medium', 'low']), (0, express_validator_1.body)('note').optional().isString(), (0, express_validator_1.body)('memberId').optional().isInt(), async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const { itemId, itemName, priority, note, memberId } = req.body;
    // Find member linked to current user
    const member = await client_1.default.member.findFirst({
        where: memberId
            ? { id: memberId, userId: req.userId } // 如果指定了 memberId，验证属于当前用户
            : { userId: req.userId } // 否则使用第一个角色
    });
    if (!member) {
        return res.status(403).json({
            error: '请先创建或认领角色，然后才能登记装备需求',
            code: 'NO_MEMBER'
        });
    }
    const requirement = await client_1.default.requirement.upsert({
        where: { memberId_itemId: { memberId: member.id, itemId } },
        update: { priority, note },
        create: { memberId: member.id, itemId, itemName, priority, note },
        include: { member: true },
    });
    return res.status(201).json(requirement);
});
// DELETE /api/requirements/:id
router.delete('/:id', auth_1.authenticate, async (req, res) => {
    const id = parseInt(req.params.id);
    const requirement = await client_1.default.requirement.findUnique({
        where: { id },
        include: { member: true },
    });
    if (!requirement)
        return res.status(404).json({ error: 'Not found' });
    // Only member themselves or leader can delete
    const member = await client_1.default.member.findFirst({ where: { userId: req.userId } });
    if (!member)
        return res.status(403).json({ error: 'Forbidden' });
    // Check if user is leader (admin)
    const user = await client_1.default.user.findUnique({ where: { id: req.userId }, select: { isLeader: true } });
    if (requirement.memberId !== member.id && !user?.isLeader) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    await client_1.default.requirement.delete({ where: { id } });
    return res.status(204).send();
});
// GET /api/requirements/tier-progress — all members tier tracking
router.get('/tier-progress', auth_1.authenticate, async (_req, res) => {
    const tierSlots = ['head', 'shoulder', 'chest', 'hands', 'legs'];
    const members = await client_1.default.member.findMany({
        where: { status: 'active' },
        orderBy: { displayName: 'asc' },
    });
    const allDistributions = await client_1.default.distribution.findMany({
        where: { drop: { isTier: true } },
        include: { drop: true },
    });
    const progress = members.map(member => {
        const memberDist = allDistributions.filter(d => d.memberId === member.id);
        const slots = {};
        for (const slot of tierSlots) {
            slots[slot] = memberDist.some(d => d.drop.slot === slot);
        }
        return {
            memberId: member.id,
            memberName: member.displayName,
            wowClass: member.wowClass,
            ...slots,
            count: Object.values(slots).filter(Boolean).length,
        };
    });
    return res.json(progress);
});
exports.default = router;
