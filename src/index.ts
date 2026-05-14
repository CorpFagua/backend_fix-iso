import './types';
import { env } from './config/env';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { corsOptions } from './config/cors';
import { swaggerSpec } from './config/swagger';
import { globalLimiter } from './middleware/rateLimiter';
import { logger } from './middleware/logger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import routes from './routes';

const app = express();

// ── Security headers (relaxed CSP for Swagger UI in development) ──
app.use(
  helmet({
    contentSecurityPolicy: env.NODE_ENV === 'development' ? false : undefined,
  }),
);

// ── CORS ──
app.use(cors(corsOptions));

// ── Body parsing with size limit ──
app.use(express.json({ limit: '10kb' }));

// ── Rate limiting (anti-DDoS) ──
app.use(globalLimiter);

// ── Request logging ──
app.use(logger);

// ── API routes ──
app.use('/api', routes);

// ── Swagger UI (development only) ──
if (env.NODE_ENV === 'development') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  console.log(`[Swagger] UI → http://localhost:${env.PORT}/api-docs`);
  console.log(`[Swagger] JSON spec → http://localhost:${env.PORT}/api-docs.json`);
}

// ── Serve uploaded files (auth-protected) ──
app.use('/uploads', authMiddleware, express.static(path.resolve(process.cwd(), 'uploads')));

// ── Health check ──
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 catch-all ──
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// ── Centralized error handler ──
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`[Fix-ISO API] Server running on port ${env.PORT} (${env.NODE_ENV})`);
});
