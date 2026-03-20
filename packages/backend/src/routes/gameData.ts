import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

// GET /api/game-data/raids
router.get('/raids', async (req, res) => {
  const wowDataPath = path.resolve(__dirname, '../../../../packages/shared/src/wow-data.json');
  if (!fs.existsSync(wowDataPath)) {
    return res.status(404).json({ error: 'wow-data.json not found' });
  }
  const data = JSON.parse(fs.readFileSync(wowDataPath, 'utf8'));
  
  res.json(data.raids);
});

export default router;
