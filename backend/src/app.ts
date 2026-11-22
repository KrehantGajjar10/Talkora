import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import postsRoutes from './modules/posts/posts.routes.js';
import commentsRoutes from './modules/comments/comments.routes.js';
import votesRoutes from './modules/votes/votes.routes.js';
import { sendError } from './utils/api-response.js';

const app: Application = express();

// Security middleware
app.use(helmet());

// Cross-Origin Resource Sharing
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  })
);

// Body and Cookie parsing middleware
app.use(express.json());
app.use(cookieParser());

// API routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api', votesRoutes);
app.use('/api', commentsRoutes);
app.use('/api/posts', postsRoutes);

// 404 Route Not Found handler
app.use((_req: Request, res: Response) => {
  sendError(res, 404, 'Route not found', []);
});

// Centralized error handler
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err instanceof Error ? err.message : err);
  sendError(res, 500, 'Internal server error', []);
});

export default app;
