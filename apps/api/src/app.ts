import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import authRouter from './modules/auth/auth.router.js';
import assetRouter from './modules/assets/asset.router.js';
import masterRouter from './modules/master/master.router.js';
import assignmentRouter from './modules/assignments/assignment.router.js';
import transferRouter from './modules/transfers/transfer.router.js';
import maintenanceRouter from './modules/maintenance/maintenance.router.js';
import reportRouter from './modules/reports/report.router.js';
import auditRouter from './modules/audit/audit.router.js';
import { errorHandler } from './middleware/error.js';

export const prisma = new PrismaClient();

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Asset Management API is running', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/assets', assetRouter);
app.use('/api/v1/master', masterRouter);
app.use('/api/v1/assignments', assignmentRouter);
app.use('/api/v1/transfers', transferRouter);
app.use('/api/v1/maintenance', maintenanceRouter);
app.use('/api/v1/reports', reportRouter);
app.use('/api/v1/audit-logs', auditRouter);

app.use(errorHandler);

export default app;
