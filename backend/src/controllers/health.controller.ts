import { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { sendSuccess, sendError } from '../utils/api-response.js';

export const getHealth = (_req: Request, res: Response): void => {
  sendSuccess(res, 200, 'Talkora API is running', {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
};

export const getReadiness = async (_req: Request, res: Response): Promise<void> => {
  try {
    await prisma.$queryRaw`SELECT 1 as ready`;
    sendSuccess(res, 200, 'Talkora API is ready', {
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Readiness check failed:', error instanceof Error ? error.message : error);
    sendError(res, 503, 'Database is not ready', [
      {
        message: 'Database connection check failed',
      },
    ]);
  }
};
