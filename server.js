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

// ── Middleware: Ensure Database Initialized for Serverless Requests ──
let dbInitialized = false;
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await initDatabase();
      dbInitialized = true;
    } catch (err) {
      console.error('Database initialization error:', err);
      return res.status(500).json({ error: 'Database initialization failed' });
    }
  }
  next();
});

// ── API Routes ──
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api', apiRouter);

// ── Local Development Listener ──
if (process.env.NODE_ENV !== 'production') {
  initDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`CareerCompass server running → http://localhost:${PORT}`);
    });
  }).catch(err => {
    console.error('Failed to start server:', err);
  });
}

// ── Export for Vercel Serverless Function ──
export default app;
