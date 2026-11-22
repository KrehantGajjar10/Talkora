import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import postsRoutes from './modules/posts/posts.routes.js';
import commentsRoutes from './modules/comments/comments.routes.js';
import votesRoutes from './modules/votes/votes.routes.js';
import docsRoutes from './docs/openapi.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { sendError } from './utils/api-response.js';

const app: Application = express();

// Trust reverse proxy (e.g. Render, Railway, AWS ALB, Nginx)
const trustProxyVal = process.env.TRUST_PROXY ?? '1';
if (trustProxyVal === 'true' || trustProxyVal === '1') {
  app.set('trust proxy', 1);
}

// Security headers with Swagger UI compatibility
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
      },
    },
  })
);

// Cross-Origin Resource Sharing with credentials
const rawFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const allowedOrigins = rawFrontendUrl
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin.replace(/\/+$/, ''))) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  })
);

// Body and Cookie parsing middleware
app.use(express.json());
app.use(cookieParser());

// API documentation
app.use('/api', docsRoutes);

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
app.use(errorHandler);

export default app;
