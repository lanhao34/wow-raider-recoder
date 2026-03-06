"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const express_validator_1 = require("express-validator");
const client_1 = __importDefault(require("../prisma/client"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// POST /api/auth/register
router.post('/register', (0, express_validator_1.body)('username').isLength({ min: 3, max: 30 }).trim(), (0, express_validator_1.body)('password').isLength({ min: 6 }), (0, express_validator_1.body)('displayName').isLength({ min: 1, max: 50 }).trim(), async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const { username, password, displayName } = req.body;
    const existing = await client_1.default.user.findUnique({ where: { username } });
    if (existing)
        return res.status(400).json({ error: 'Username already exists' });
    const passwordHash = await bcryptjs_1.default.hash(password, 12);
    const user = await client_1.default.user.create({
        data: { username, passwordHash, displayName },
    });
    // First user to register automatically becomes the guild leader
    const memberCount = await client_1.default.member.count();
    let member = null;
    if (memberCount === 0) {
        member = await client_1.default.member.create({
            data: {
                userId: user.id,
                displayName,
                wowClass: 'warrior',
                wowClassZh: '战士',
                isLeader: true,
                status: 'active',
            },
        });
    }
    const token = (0, auth_1.generateToken)(user.id);
    return res.status(201).json({
        token,
        user: { id: user.id, username: user.username, displayName: user.displayName },
        member: member
            ? {
                id: member.id,
                displayName: member.displayName,
                wowClass: member.wowClass,
                wowClassZh: member.wowClassZh,
                isLeader: member.isLeader,
                status: member.status,
            }
            : null,
    });
});
// POST /api/auth/login
router.post('/login', (0, express_validator_1.body)('username').notEmpty().trim(), (0, express_validator_1.body)('password').notEmpty(), async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    const { username, password } = req.body;
    const user = await client_1.default.user.findUnique({ where: { username } });
    if (!user)
        return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!valid)
        return res.status(401).json({ error: 'Invalid credentials' });
    const member = await client_1.default.member.findFirst({
        where: { userId: user.id },
    });
    const token = (0, auth_1.generateToken)(user.id);
    return res.json({
        token,
        user: { id: user.id, username: user.username, displayName: user.displayName },
        member: member
            ? {
                id: member.id,
                displayName: member.displayName,
                wowClass: member.wowClass,
                wowClassZh: member.wowClassZh,
                isLeader: member.isLeader,
                status: member.status,
            }
            : null,
    });
});
// GET /api/auth/me
router.get('/me', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer '))
        return res.status(401).json({ error: 'No token' });
    const jwt = await Promise.resolve().then(() => __importStar(require('jsonwebtoken')));
    const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
    try {
        const payload = jwt.default.verify(authHeader.split(' ')[1], JWT_SECRET);
        const user = await client_1.default.user.findUnique({ where: { id: payload.userId } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const member = await client_1.default.member.findFirst({ where: { userId: user.id } });
        return res.json({
            user: { id: user.id, username: user.username, displayName: user.displayName },
            member: member
                ? {
                    id: member.id,
                    displayName: member.displayName,
                    wowClass: member.wowClass,
                    wowClassZh: member.wowClassZh,
                    isLeader: member.isLeader,
                    status: member.status,
                }
                : null,
        });
    }
    catch {
        return res.status(401).json({ error: 'Invalid token' });
    }
});
exports.default = router;
