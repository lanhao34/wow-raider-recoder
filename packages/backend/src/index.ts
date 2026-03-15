import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import memberRoutes from './routes/members';
import claimRoutes from './routes/claims';
import scheduleRoutes from './routes/schedules';
import raidKillRoutes from './routes/raidKills';
import dropRoutes from './routes/drops';
import distributionRoutes from './routes/distributions';
import requirementRoutes from './routes/requirements';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/raid-kills', raidKillRoutes);
app.use('/api/drops', dropRoutes);
app.use('/api/distributions', distributionRoutes);
app.use('/api/requirements', requirementRoutes);

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// 绑定到 0.0.0.0 允许 Docker 网络访问
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on 0.0.0.0:${PORT}`);
});

// 保持进程存活（防止 Node.js 在事件循环为空时退出）
const keepAlive = setInterval(() => {}, 2147483647);

export default app;
