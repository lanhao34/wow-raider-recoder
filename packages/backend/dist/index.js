"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = __importDefault(require("./routes/auth"));
const members_1 = __importDefault(require("./routes/members"));
const claims_1 = __importDefault(require("./routes/claims"));
const schedules_1 = __importDefault(require("./routes/schedules"));
const raidKills_1 = __importDefault(require("./routes/raidKills"));
const drops_1 = __importDefault(require("./routes/drops"));
const distributions_1 = __importDefault(require("./routes/distributions"));
const requirements_1 = __importDefault(require("./routes/requirements"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
}));
app.use(express_1.default.json());
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/members', members_1.default);
app.use('/api/claims', claims_1.default);
app.use('/api/schedules', schedules_1.default);
app.use('/api/raid-kills', raidKills_1.default);
app.use('/api/drops', drops_1.default);
app.use('/api/distributions', distributions_1.default);
app.use('/api/requirements', requirements_1.default);
// Error handler
app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});
app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});
exports.default = app;
