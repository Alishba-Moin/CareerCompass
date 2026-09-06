import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';
import { initDatabase } from './database/db.js';
import { healthRouter } from './routes/health.js';
import { apiRouter } from './routes/api.js';
import { authRouter } from './routes/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// ── API Routes ──
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api', apiRouter);

// ── Initialize database ──
await initDatabase();

// ── Start local server (skipped automatically on Vercel) ──
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`CareerCompass server running → http://localhost:${PORT}`);
  });
}

export default app;