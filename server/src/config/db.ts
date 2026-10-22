import mongoose from 'mongoose';
import { ENV } from './env.js';

let cachedPromise: Promise<typeof mongoose> | null = null;

export const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  if (!cachedPromise) {
    cachedPromise = mongoose.connect(ENV.MONGODB_URI).then((conn) => {
      console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    }).catch((error) => {
      cachedPromise = null;
      console.error(`[Database Error] ${(error as Error).message}`);
      if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
        process.exit(1);
      }
      throw error;
    });
  }

  await cachedPromise;
};
