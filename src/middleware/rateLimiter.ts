import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

const skipInDev = () => env.NODE_ENV === 'development';

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
  message: { error: 'Demasiadas peticiones, intente de nuevo más tarde' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInDev,
  message: { error: 'Demasiados intentos de autenticación, intente de nuevo más tarde' },
});
