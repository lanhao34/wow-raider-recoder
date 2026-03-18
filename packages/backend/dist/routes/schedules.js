"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = __importDefault(require("../prisma/client"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/schedules - 获取活动列表
router.get('/', auth_1.authenticate, async (req, res) => {
    const { week, month, raidId, difficulty } = req.query;
    const schedules = await client_1.default.raidSchedule.findMany({
        where: {
            ...(week ? { weekId: week } : {}),
            ...(raidId ? { raidId } : {}),
            ...(difficulty ? { difficulty } : {}),
        },
        include: {
            creator: {
                select: {
                    username: true,
                    displayName: true,
                },
            },
            participants: {
                include: {
                    member: {
                        select: {
                            displayName: true,
                            wowClass: true,
                            wowClassZh: true,
                        },
                    },
                },
            },
        },
        orderBy: {
            date: 'asc',
        },
    });
    res.json(schedules);
});
// POST /api/schedules - 创建活动（仅管理员）
router.post('/', auth_1.authenticate, auth_1.requireLeader, async (req, res) => {
    const { date, raidId = 'sunwell', raidName = 'Sunwell Plateau', raidNameZh = '太阳井高地', difficulty = 'normal', teamName, maxPlayers = 20, maxSubstitutes = 10, teamSetup, note, } = req.body;
    if (!date) {
        return res.status(400).json({ error: '缺少必要参数：日期' });
    }
    // 计算 weekId
    const eventDate = new Date(date);
    const dayNum = eventDate.getDay() || 7;
    eventDate.setDate(eventDate.getDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(eventDate.getFullYear(), 0, 1));
    const weekNo = Math.ceil((((eventDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    const weekId = `${eventDate.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
    const schedule = await client_1.default.raidSchedule.create({
        data: {
            date,
            weekId,
            raidId,
            raidName,
            raidNameZh,
            difficulty,
            teamName: teamName || null,
            maxPlayers,
            maxSubstitutes,
            teamSetup: teamSetup ? JSON.stringify(teamSetup) : null,
            note: note || null,
            createdBy: req.userId,
            participantIds: '[]',
        },
    });
    res.status(201).json(schedule);
});
// GET /api/schedules/:id - 获取活动详情
router.get('/:id', auth_1.authenticate, async (req, res) => {
    const id = parseInt(req.params.id);
    const schedule = await client_1.default.raidSchedule.findUnique({
        where: { id },
        include: {
            creator: {
                select: {
                    username: true,
                    displayName: true,
                },
            },
            participants: {
                include: {
                    member: {
                        select: {
                            displayName: true,
                            wowClass: true,
                            wowClassZh: true,
                            userId: true,
                        },
                    },
                },
                orderBy: {
                    slot: 'asc',
                },
            },
            raids: true,
        },
    });
    if (!schedule) {
        return res.status(404).json({ error: '活动不存在' });
    }
    res.json(schedule);
});
// PUT /api/schedules/:id - 更新活动（仅管理员）
router.put('/:id', auth_1.authenticate, auth_1.requireLeader, async (req, res) => {
    const id = parseInt(req.params.id);
    const { date, raidId, raidName, raidNameZh, difficulty, teamName, maxPlayers, maxSubstitutes, teamSetup, note, } = req.body;
    const schedule = await client_1.default.raidSchedule.findUnique({ where: { id } });
    if (!schedule) {
        return res.status(404).json({ error: '活动不存在' });
    }
    const updated = await client_1.default.raidSchedule.update({
        where: { id },
        data: {
            ...(date ? { date } : {}),
            ...(raidId ? { raidId } : {}),
            ...(raidName ? { raidName } : {}),
            ...(raidNameZh ? { raidNameZh } : {}),
            ...(difficulty ? { difficulty } : {}),
            ...(teamName !== undefined ? { teamName } : {}),
            ...(maxPlayers !== undefined ? { maxPlayers } : {}),
            ...(maxSubstitutes !== undefined ? { maxSubstitutes } : {}),
            ...(teamSetup !== undefined ? { teamSetup: JSON.stringify(teamSetup) } : {}),
            ...(note !== undefined ? { note } : {}),
        },
    });
    res.json(updated);
});
// DELETE /api/schedules/:id - 删除活动（仅管理员）
router.delete('/:id', auth_1.authenticate, auth_1.requireLeader, async (req, res) => {
    const id = parseInt(req.params.id);
    await client_1.default.raidSchedule.delete({
        where: { id },
    });
    res.json({ success: true });
});
// POST /api/schedules/:id/participants - 报名活动
router.post('/:id/participants', auth_1.authenticate, async (req, res) => {
    const scheduleId = parseInt(req.params.id);
    const { memberId, status = 'pending' } = req.body;
    if (!memberId) {
        return res.status(400).json({ error: '缺少角色 ID' });
    }
    // 验证角色属于当前用户
    const member = await client_1.default.member.findFirst({
        where: { id: memberId, userId: req.userId },
    });
    if (!member) {
        return res.status(403).json({ error: '无权为该角色报名' });
    }
    // 检查是否已报名
    const existing = await client_1.default.raidParticipant.findUnique({
        where: {
            scheduleId_memberId: {
                scheduleId,
                memberId,
            },
        },
    });
    if (existing) {
        return res.status(400).json({ error: '已报名该活动' });
    }
    // 检查人数限制
    const schedule = await client_1.default.raidSchedule.findUnique({
        where: { id: scheduleId },
        include: {
            participants: true,
        },
    });
    if (!schedule) {
        return res.status(404).json({ error: '活动不存在' });
    }
    const confirmedCount = schedule.participants.filter(p => p.status === 'confirmed').length;
    const substituteCount = schedule.participants.filter(p => p.status === 'substitute').length;
    let finalStatus = status;
    let slot = null;
    if (status === 'confirmed' || status === 'pending') {
        if (confirmedCount >= schedule.maxPlayers) {
            // 正选已满，询问是否接受替补
            return res.status(400).json({
                error: '正选已满，是否接受替补？',
                code: 'FULL_TRY_SUBSTITUTE'
            });
        }
        finalStatus = 'confirmed';
        slot = confirmedCount;
    }
    else if (status === 'substitute') {
        if (substituteCount >= schedule.maxSubstitutes) {
            return res.status(400).json({ error: '替补已满' });
        }
        slot = schedule.maxPlayers + substituteCount;
    }
    const participant = await client_1.default.raidParticipant.create({
        data: {
            scheduleId,
            memberId,
            status: finalStatus,
            slot,
        },
        include: {
            member: {
                select: {
                    displayName: true,
                    wowClass: true,
                    wowClassZh: true,
                },
            },
        },
    });
    res.status(201).json(participant);
});
// PUT /api/schedules/:id/participants/:memberId - 更新报名状态（仅管理员）
router.put('/:id/participants/:memberId', auth_1.authenticate, auth_1.requireLeader, async (req, res) => {
    const scheduleId = parseInt(req.params.id);
    const memberId = parseInt(req.params.memberId);
    const { status, slot, checkedIn } = req.body;
    const participant = await client_1.default.raidParticipant.findUnique({
        where: {
            scheduleId_memberId: {
                scheduleId,
                memberId,
            },
        },
    });
    if (!participant) {
        return res.status(404).json({ error: '报名记录不存在' });
    }
    const updated = await client_1.default.raidParticipant.update({
        where: {
            scheduleId_memberId: {
                scheduleId,
                memberId,
            },
        },
        data: {
            ...(status ? { status } : {}),
            ...(slot !== undefined ? { slot } : {}),
            ...(checkedIn !== undefined ? { checkedIn } : {}),
        },
        include: {
            member: {
                select: {
                    displayName: true,
                    wowClass: true,
                    wowClassZh: true,
                },
            },
        },
    });
    res.json(updated);
});
// DELETE /api/schedules/:id/participants/:memberId - 取消报名
router.delete('/:id/participants/:memberId', auth_1.authenticate, async (req, res) => {
    const scheduleId = parseInt(req.params.id);
    const memberId = parseInt(req.params.memberId);
    // 验证角色属于当前用户，或者是管理员
    const member = await client_1.default.member.findFirst({
        where: { id: memberId },
    });
    if (!member) {
        return res.status(404).json({ error: '角色不存在' });
    }
    const isOwner = member.userId === req.userId;
    const user = await client_1.default.user.findUnique({
        where: { id: req.userId },
        select: { isLeader: true, isSuperAdmin: true },
    });
    const isAdmin = user?.isLeader || user?.isSuperAdmin;
    if (!isOwner && !isAdmin) {
        return res.status(403).json({ error: '无权取消该报名' });
    }
    await client_1.default.raidParticipant.delete({
        where: {
            scheduleId_memberId: {
                scheduleId,
                memberId,
            },
        },
    });
    res.json({ success: true });
});
// POST /api/schedules/:id/checkin - 批量签到（仅管理员）
router.post('/:id/checkin', auth_1.authenticate, auth_1.requireLeader, async (req, res) => {
    const scheduleId = parseInt(req.params.id);
    const { checkedInMemberIds, absentMemberIds, leaveMemberIds } = req.body;
    // 更新签到状态
    const updates = await Promise.all([
        // 标记为出勤
        ...(checkedInMemberIds || []).map(memberId => client_1.default.raidParticipant.update({
            where: {
                scheduleId_memberId: { scheduleId, memberId },
            },
            data: { checkedIn: true, status: 'confirmed' },
        })),
        // 标记为缺勤
        ...(absentMemberIds || []).map(memberId => client_1.default.raidParticipant.update({
            where: {
                scheduleId_memberId: { scheduleId, memberId },
            },
            data: { checkedIn: false, status: 'absent' },
        })),
        // 标记为请假
        ...(leaveMemberIds || []).map(memberId => client_1.default.raidParticipant.update({
            where: {
                scheduleId_memberId: { scheduleId, memberId },
            },
            data: { checkedIn: false, status: 'leave' },
        })),
    ]);
    res.json({ success: true, updates });
});
exports.default = router;
