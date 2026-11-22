import 'dotenv/config';
import { env } from './config/env.js';
import app from './app.js';
import { prisma } from './config/prisma.js';

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  console.log(`🚀 Talkora backend server running at http://localhost:${PORT}`);
  console.log(`📚 Swagger UI documentation available at http://localhost:${PORT}/api/docs`);
  console.log(`📄 Raw OpenAPI specification available at http://localhost:${PORT}/api/docs.json`);
});

server.on('error', (error: Error) => {
  console.error('Server startup error:', error.message);
  process.exit(1);
});

// Graceful shutdown handling
let isShuttingDown = false;

const gracefulShutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\nReceived ${signal}. Gracefully shutting down Talkora server...`);

  // Close HTTP server to stop accepting new requests
  server.close(async () => {
    console.log('HTTP connection pool drained and server closed.');
    try {
      await prisma.$disconnect();
      console.log('Neon database connection closed cleanly.');
      process.exit(0);
    } catch (err) {
      console.error('Error during database disconnection:', err);
      process.exit(1);
    }
  });

  // Force close after 10 seconds if hanging
  setTimeout(() => {
    console.error('Forceful termination: graceful shutdown timed out after 10s.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});
