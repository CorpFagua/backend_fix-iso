import type { CorsOptions } from 'cors';
import { env } from './env';

const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no Origin header (ZAP proxy, curl, Postman, etc.) in development
    if (!origin) {
      if (env.NODE_ENV === 'development') return callback(null, true);
      return callback(null, false);
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (env.NODE_ENV === 'development') {
      // In development, also allow ZAP's built-in browser origin
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
