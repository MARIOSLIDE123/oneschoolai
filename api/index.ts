import express, { Request, Response } from 'express';
import apiRouter from '../server/routes/api.js';

const app = express();

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'OneSchool AI Server (Vercel Serverless)',
    timestamp: new Date().toISOString(),
    timezone: 'Asia/Ho_Chi_Minh',
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'OneSchool AI Server (Vercel Serverless)',
    timestamp: new Date().toISOString(),
    timezone: 'Asia/Ho_Chi_Minh',
  });
});

// Support both /api prefixed routes and direct routes when rewritten by Vercel
app.use('/api', apiRouter);
app.use('/', apiRouter);

export default app;
