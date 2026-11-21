import 'dotenv/config';
import prisma from '../config/prisma.js';

async function checkDatabaseConnection(): Promise<void> {
  console.log('Testing connection to Neon PostgreSQL via Prisma...');
  try {
    await prisma.$connect();
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    console.log('✅ Successfully connected to Neon PostgreSQL!');
    console.log('Query result:', result);
  } catch (error) {
    console.error('❌ Failed to connect to Neon PostgreSQL.');
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    } else {
      console.error('Unknown error occurred.');
    }
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    console.log('Database connection closed.');
  }
}

void checkDatabaseConnection();
