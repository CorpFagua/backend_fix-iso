import type { Request, Response, NextFunction } from 'express';
import '../types';

export function rbac(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const hasPermission = requiredPermissions.some(p =>
      req.user!.permissions.includes(p)
    );

    if (!hasPermission) {
      res.status(403).json({ error: 'No tiene permisos para esta acción' });
      return;
    }

    next();
  };
}
