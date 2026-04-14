import dotenv from 'dotenv';
import { z } from 'zod/v4';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  PORT: z.coerce.number().default(3000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BIGDATA_API_URL: z.string().default('http://localhost:8000'),
  GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY: z.string().optional(),
  GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY_FILE: z.string().optional(),
  GOOGLE_DRIVE_ROOT_FOLDER_ID: z.string().optional(),
  GOOGLE_DRIVE_TEMPLATES_FOLDER_ID: z.string().optional(),
  GOOGLE_DRIVE_COMPANIES_FOLDER_ID: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
