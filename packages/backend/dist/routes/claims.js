"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = __importDefault(require("../prisma/client"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/claims/available - 获取可认领的角色列表
router.get('/available', auth_1.authenticate, async (req, res) => {
    const unclaimedMembers = await client_1.default.member.findMany({
        where: {
            userId: null,
            isClaimed: false,
        },
        orderBy: {
            displayName: 'asc',
        },
    });
    res.json(unclaimedMembers);
});
// POST /api/claims/request - 申请认领角色
router.post('/request', auth_1.authenticate, async (req, res) => {
    const { memberId } = req.body;
    if (!memberId) {
        return res.status(400).json({ error: '缺少角色 ID' });
    }
    const member = await client_1.default.member.findUnique({
        where: { id: memberId },
        include: {
            user: {
                select: {
                    username: true,
                },
            },
        },
    });
    if (!member) {
        return res.status(404).json({ error: '角色不存在' });
    }
    if (member.userId !== null) {
        return res.status(400).json({ error: '该角色已被认领' });
    }
    if (member.isClaimed) {
        return res.status(400).json({ error: '该角色已在认领审核中' });
    }
    // 标记为待确认状态
    await client_1.default.member.update({
        where: { id: memberId },
        data: {
            isClaimed: true,
        },
    });
    res.json({
        success: true,
        message: '认领申请已提交，等待团长确认',
    });
});
// GET /api/claims/pending - 获取待确认的认领申请（仅团长/超管）
router.get('/pending', auth_1.authenticate, async (req, res) => {
    if (!req.isLeader && !req.isSuperAdmin) {
        return res.status(403).json({ error: '权限不足' });
    }
    const pendingClaims = await client_1.default.member.findMany({
        where: {
            userId: null,
            isClaimed: true,
        },
        include: {
            requirements: {
                select: {
                    itemId: true,
                    itemName: true,
                    priority: true,
                },
            },
        },
        orderBy: {
            displayName: 'asc',
        },
    });
    res.json(pendingClaims);
});
// POST /api/claims/approve - 确认认领申请（仅团长/超管）
router.post('/approve', auth_1.authenticate, async (req, res) => {
    if (!req.isLeader && !req.isSuperAdmin) {
        return res.status(403).json({ error: '权限不足' });
    }
    const { memberId, userId } = req.body;
    if (!memberId || !userId) {
        return res.status(400).json({ error: '缺少参数' });
    }
    const member = await client_1.default.member.findUnique({
        where: { id: memberId },
    });
    if (!member) {
        return res.status(404).json({ error: '角色不存在' });
    }
    // 关联用户
    await client_1.default.member.update({
        where: { id: memberId },
        data: {
            userId,
            isClaimed: false,
        },
    });
    res.json({
        success: true,
        message: '认领已确认',
    });
});
// POST /api/claims/reject - 拒绝认领申请（仅团长/超管）
router.post('/reject', auth_1.authenticate, async (req, res) => {
    if (!req.isLeader && !req.isSuperAdmin) {
        return res.status(403).json({ error: '权限不足' });
    }
    const { memberId } = req.body;
    const member = await client_1.default.member.findUnique({
        where: { id: memberId },
    });
    if (!member) {
        return res.status(404).json({ error: '角色不存在' });
    }
    // 重置认领状态
    await client_1.default.member.update({
        where: { id: memberId },
        data: {
            isClaimed: false,
        },
    });
    res.json({
        success: true,
        message: '已拒绝认领申请',
    });
});
exports.default = router;
