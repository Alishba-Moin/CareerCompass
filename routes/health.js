import { Router } from 'express';
import { getDb } from '../database/db.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  let dbStatus = 'ok';
  try {
    const db = getDb();
    db.run('SELECT 1');
  } catch {
    dbStatus = 'error';
  }

  res.json({
    status: 'ok',
    service: 'CareerCompass',
    version: '0.1.0',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});
