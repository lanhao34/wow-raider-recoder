"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireLeader = requireLeader;
exports.loadMember = loadMember;
exports.generateToken = generateToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = __importDefault(require("../prisma/client"));
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.userId = payload.userId;
        next();
    }
    catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}
async function requireLeader(req, res, next) {
    authenticate(req, res, async () => {
        const member = await client_1.default.member.findFirst({
            where: { userId: req.userId, isLeader: true },
        });
        if (!member) {
            return res.status(403).json({ error: 'Leader access required' });
        }
        req.isLeader = true;
        req.memberId = member.id;
        next();
    });
}
async function loadMember(req, _res, next) {
    if (req.userId) {
        const member = await client_1.default.member.findFirst({
            where: { userId: req.userId },
        });
        if (member) {
            req.isLeader = member.isLeader;
            req.memberId = member.id;
        }
    }
    next();
}
function generateToken(userId) {
    return jsonwebtoken_1.default.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}
