import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import memberRoutes from './routes/members';
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

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

export default app;
