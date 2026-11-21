import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import healthRoutes from './routes/health.routes.js';

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

// Body parsing middleware
app.use(express.json());

// API routes
app.use('/api', healthRoutes);

export default app;
