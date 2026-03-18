"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = __importDefault(require("../prisma/client"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/claims/available - 获取可认领的角色列表（未关联用户的角色）
router.get('/available', auth_1.authenticate, async (req, res) => {
    const unclaimedMembers = await client_1.default.member.findMany({
        where: {
            userId: null,
        },
        orderBy: {
            displayName: 'asc',
        },
    });
    res.json(unclaimedMembers);
});
// POST /api/claims/request - 直接认领角色
router.post('/request', auth_1.authenticate, async (req, res) => {
    const { memberId } = req.body;
    if (!memberId) {
        return res.status(400).json({ error: '缺少角色 ID' });
    }
    const member = await client_1.default.member.findUnique({
        where: { id: memberId },
    });
    if (!member) {
        return res.status(404).json({ error: '角色不存在' });
    }
    if (member.userId !== null) {
        return res.status(400).json({ error: '该角色已被认领' });
    }
    // 直接关联用户到角色
    await client_1.default.member.update({
        where: { id: memberId },
        data: {
            userId: req.userId,
            source: 'claimed',
        },
    });
    res.json({
        success: true,
        message: '角色认领成功',
    });
});
exports.default = router;
