"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = __importDefault(require("../prisma/client"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/members - 获取所有成员（管理员可见）
router.get('/', auth_1.authenticate, auth_1.requireLeader, async (req, res) => {
    const members = await client_1.default.member.findMany({
        include: {
            user: {
                select: {
                    username: true,
                    isSuperAdmin: true,
                    isLeader: true, // User 的管理员权限
                },
            },
        },
        orderBy: {
            displayName: 'asc',
        },
    });
    res.json(members.map(m => ({
        id: m.id,
        displayName: m.displayName,
        wowClass: m.wowClass,
        wowClassZh: m.wowClassZh,
        status: m.status,
        userId: m.userId,
        username: m.user?.username || null,
        isSuperAdmin: m.user?.isSuperAdmin || false,
        isLeader: m.user?.isLeader || false, // 返回 User 的 isLeader 权限
    })));
});
// GET /api/members/stats - 获取所有成员的统计信息（管理员可见）
router.get('/stats', auth_1.authenticate, auth_1.requireLeader, async (req, res) => {
    const members = await client_1.default.member.findMany({
        include: {
            user: {
                select: {
                    username: true,
                    isSuperAdmin: true,
                    isLeader: true,
                },
            },
            requirements: {
                select: {
                    id: true,
                    itemId: true,
                    itemName: true,
                    priority: true,
                },
            },
            distributions: {
                select: {
                    id: true,
                    distributedAt: true,
                    drop: {
                        select: {
                            itemId: true,
                            itemName: true,
                            itemLevel: true,
                        },
                    },
                },
            },
        },
    });
    // 统计活动参与次数（从 RaidSchedule 的 participantIds 中统计）
    const allSchedules = await client_1.default.raidSchedule.findMany({
        select: {
            id: true,
            participantIds: true,
        },
    });
    const stats = members.map(member => {
        // 统计活动参与次数
        const participationCount = allSchedules.filter(s => {
            const participantIds = JSON.parse(s.participantIds);
            return participantIds.includes(member.id);
        }).length;
        // 统计装备获取
        const itemsReceived = member.distributions.map(d => ({
            itemId: d.drop.itemId,
            itemName: d.drop.itemName,
            itemLevel: d.drop.itemLevel,
            distributedAt: d.distributedAt,
        }));
        return {
            id: member.id,
            displayName: member.displayName,
            wowClass: member.wowClass,
            wowClassZh: member.wowClassZh,
            status: member.status,
            userId: member.userId,
            username: member.user?.username || null,
            isLeader: member.user?.isLeader || false,
            isSuperAdmin: member.user?.isSuperAdmin || false,
            stats: {
                participationCount,
                itemsReceivedCount: itemsReceived.length,
                itemsReceived,
                requirementsCount: member.requirements.length,
                requirements: member.requirements,
            },
        };
    });
    res.json(stats);
});
// GET /api/members/:id/stats - 获取单个成员的统计信息
router.get('/:id/stats', auth_1.authenticate, async (req, res) => {
    const id = parseInt(req.params.id);
    const member = await client_1.default.member.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    username: true,
                    isSuperAdmin: true,
                    isLeader: true,
                },
            },
            requirements: {
                select: {
                    id: true,
                    itemId: true,
                    itemName: true,
                    priority: true,
                },
            },
            distributions: {
                select: {
                    id: true,
                    distributedAt: true,
                    drop: {
                        select: {
                            itemId: true,
                            itemName: true,
                            itemLevel: true,
                        },
                    },
                },
            },
        },
    });
    if (!member) {
        return res.status(404).json({ error: '角色不存在' });
    }
    // 统计活动参与次数
    const allSchedules = await client_1.default.raidSchedule.findMany({
        select: {
            id: true,
            participantIds: true,
        },
    });
    const participationCount = allSchedules.filter(s => {
        const participantIds = JSON.parse(s.participantIds);
        return participantIds.includes(member.id);
    }).length;
    const itemsReceived = member.distributions.map(d => ({
        itemId: d.drop.itemId,
        itemName: d.drop.itemName,
        itemLevel: d.drop.itemLevel,
        distributedAt: d.distributedAt,
    }));
    res.json({
        id: member.id,
        displayName: member.displayName,
        wowClass: member.wowClass,
        wowClassZh: member.wowClassZh,
        status: member.status,
        userId: member.userId,
        username: member.user?.username || null,
        isLeader: member.user?.isLeader || false,
        isSuperAdmin: member.user?.isSuperAdmin || false,
        stats: {
            participationCount,
            itemsReceivedCount: itemsReceived.length,
            itemsReceived,
            requirementsCount: member.requirements.length,
            requirements: member.requirements,
        },
    });
});
// POST /api/members - 创建新成员
// - 普通用户：只能给自己创建角色（自动绑定）
// - 管理员/超管：可以创建未绑定角色（供认领）或指定绑定用户
router.post('/', auth_1.authenticate, async (req, res) => {
    const { displayName, wowClass, wowClassZh, status, userId, bindToSelf } = req.body;
    let targetUserId = null;
    let source = 'created';
    // 普通用户只能给自己创建角色
    if (!req.isLeader && !req.isSuperAdmin) {
        targetUserId = req.userId;
    }
    else {
        // 管理员/超管可以创建未绑定角色
        if (userId !== undefined && userId !== null) {
            // 明确指定了 userId，绑定到该用户
            targetUserId = userId;
        }
        else if (bindToSelf === true) {
            // 明确要求自己绑定
            targetUserId = req.userId;
        }
        else {
            // 默认创建未绑定角色（可被认领）
            targetUserId = null;
            source = 'created';
        }
    }
    const member = await client_1.default.member.create({
        data: {
            displayName,
            wowClass,
            wowClassZh,
            status: status || 'active',
            userId: targetUserId,
            source,
        },
    });
    res.status(201).json(member);
});
// PUT /api/members/:id - 更新成员（管理员可见）
router.put('/:id', auth_1.authenticate, auth_1.requireLeader, async (req, res) => {
    const id = parseInt(req.params.id);
    const { displayName, wowClass, wowClassZh, status } = req.body;
    const member = await client_1.default.member.update({
        where: { id },
        data: {
            displayName,
            wowClass,
            wowClassZh,
            status,
        },
    });
    res.json(member);
});
// DELETE /api/members/:id - 删除成员（管理员可见）
router.delete('/:id', auth_1.authenticate, auth_1.requireLeader, async (req, res) => {
    const id = parseInt(req.params.id);
    const member = await client_1.default.member.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    isSuperAdmin: true,
                },
            },
        },
    });
    if (!member) {
        return res.status(404).json({ error: '角色不存在' });
    }
    // 超管可以删除任何角色
    if (req.isSuperAdmin) {
        await client_1.default.member.delete({ where: { id } });
        return res.json({ success: true });
    }
    // 管理员不能删除超管用户的角色
    if (member.user?.isSuperAdmin) {
        return res.status(403).json({ error: '不能删除超级管理员的角色' });
    }
    await client_1.default.member.delete({ where: { id } });
    res.json({ success: true });
});
// PUT /api/members/:id/set-leader - 指定/取消管理员（仅超管）
router.put('/:id/set-leader', auth_1.authenticate, async (req, res) => {
    const id = parseInt(req.params.id);
    const { isLeader } = req.body;
    // 只有超管可以指定管理员
    if (!req.isSuperAdmin) {
        return res.status(403).json({ error: '只有超级管理员可以指定管理员' });
    }
    const member = await client_1.default.member.findUnique({
        where: { id },
        include: {
            user: true,
        },
    });
    if (!member) {
        return res.status(404).json({ error: '角色不存在' });
    }
    if (!member.userId) {
        return res.status(400).json({ error: '该角色未关联用户' });
    }
    // 更新 User 的 isLeader 字段
    await client_1.default.user.update({
        where: { id: member.userId },
        data: { isLeader },
    });
    res.json({
        success: true,
        message: isLeader ? '已指定为管理员' : '已取消管理员权限',
    });
});
exports.default = router;
