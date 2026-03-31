import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import prisma from '../config/database';
import '../types';

interface PermissionRecord {
  permission: { name: string };
}

interface RoleRecord {
  role: {
    name: string;
    rolePermissions: PermissionRecord[];
  };
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de acceso requerido' });
    return;
  }

  const token = header.slice(7);

  try {
    const payload = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Usuario no autorizado o cuenta desactivada' });
      return;
    }

    const typedRoles = user.userRoles as RoleRecord[];
    const roles = typedRoles.map(ur => ur.role.name);
    const permissions: string[] = [
      ...new Set(
        typedRoles.flatMap(ur =>
          ur.role.rolePermissions.map(rp => rp.permission.name)
        )
      ),
    ];

    req.user = {
      id: user.id,
      email: user.email,
      roles,
      permissions,
    };

    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
