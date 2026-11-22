import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import postsRoutes from './modules/posts/posts.routes.js';
import commentsRoutes from './modules/comments/comments.routes.js';
import votesRoutes from './modules/votes/votes.routes.js';
import docsRoutes from './docs/openapi.js';
import { validateOrigin, getAllowedOrigins, normalizeOrigin } from './middlewares/origin.middleware.js';
import { mutationRateLimiter, authRateLimiter } from './middlewares/rate-limiter.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { sendError } from './utils/api-response.js';

const app: Application = express();

// Trust reverse proxy (e.g. Render, Railway, AWS ALB, Nginx)
if (env.TRUST_PROXY !== false) {
  app.set('trust proxy', env.TRUST_PROXY);
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
const allowedOrigins = getAllowedOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      const normalized = normalizeOrigin(origin);
      if (allowedOrigins.includes(normalized)) {
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

// API documentation (public)
app.use('/api', docsRoutes);

// Health and Readiness checks (public, exempt from CSRF / rate-limiting)
app.use('/api', healthRoutes);

// Origin / CSRF validation across all API mutation routes
app.use('/api', validateOrigin);

// Mutation rate limiter for non-safe HTTP methods across /api
app.use('/api', (req: Request, res: Response, next) => {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase())) {
    return mutationRateLimiter(req, res, next);
  }
  next();
});

// Auth endpoints with dedicated auth rate limiter
app.use('/api/auth', authRateLimiter, authRoutes);

// Resource routes
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
