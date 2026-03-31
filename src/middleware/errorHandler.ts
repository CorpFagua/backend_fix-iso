import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod/v4';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(`[ERROR] ${err.name}: ${err.message}`);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    const details = err.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    res.status(400).json({ error: 'Datos de entrada inválidos', details });
    return;
  }

  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[])?.join(', ') ?? 'campo';
      res.status(409).json({ error: `Ya existe un registro con ese ${target}` });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Recurso no encontrado' });
      return;
    }
  }

  res.status(500).json({ error: 'Error interno del servidor' });
}
