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
        req.isSuperAdmin = payload.isSuperAdmin || false;
        req.isLeader = payload.isLeader || false;
        next();
    }
    catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}
async function requireLeader(req, res, next) {
    authenticate(req, res, async () => {
        // Super admin has leader permissions
        if (req.isSuperAdmin) {
            req.isLeader = true;
            return next();
        }
        // Check User.isLeader field
        const user = await client_1.default.user.findUnique({
            where: { id: req.userId },
            select: { isLeader: true },
        });
        if (!user?.isLeader) {
            return res.status(403).json({ error: 'Leader access required' });
        }
        req.isLeader = true;
        next();
    });
}
async function loadMember(req, _res, next) {
    if (req.userId) {
        // Super admin has leader permissions
        if (req.isSuperAdmin) {
            req.isLeader = true;
            return next();
        }
        // Load User.isLeader
        const user = await client_1.default.user.findUnique({
            where: { id: req.userId },
            select: { isLeader: true },
        });
        if (user) {
            req.isLeader = user.isLeader;
        }
    }
    next();
}
function generateToken(userId, isSuperAdmin = false, isLeader = false) {
    return jsonwebtoken_1.default.sign({ userId, isSuperAdmin, isLeader }, JWT_SECRET, { expiresIn: '30d' });
}
