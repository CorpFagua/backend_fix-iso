import type { Request, Response } from 'express';
import prisma from '../../config/database';

// ── Roles ──

export async function listRoles(_req: Request, res: Response) {
  const roles = await prisma.role.findMany({
    include: {
      _count: { select: { userRoles: true, rolePermissions: true } },
    },
    orderBy: { id: 'asc' },
  });

  const data = roles.map(r => ({
    id: r.id,
    name: r.name,
    description: r.description,
    usersCount: r._count.userRoles,
    permissionsCount: r._count.rolePermissions,
  }));
  res.json({ data });
}

export async function createRole(req: Request, res: Response) {
  const { name, description, permissionIds } = req.body;
  const role = await prisma.role.create({
    data: {
      name,
      description,
      rolePermissions: {
        create: (permissionIds ?? []).map((pid: number) => ({ permissionId: pid })),
      },
    },
    include: { _count: { select: { userRoles: true, rolePermissions: true } } },
  });

  res.status(201).json({
    data: {
      id: role.id,
      name: role.name,
      description: role.description,
      usersCount: role._count.userRoles,
      permissionsCount: role._count.rolePermissions,
    },
  });
}

export async function updateRole(req: Request, res: Response) {
  const id = parseInt(String(req.params.id));
  const { name, description } = req.body;
  const role = await prisma.role.update({
    where: { id },
    data: { name, description },
    include: { _count: { select: { userRoles: true, rolePermissions: true } } },
  });

  res.json({
    data: {
      id: role.id,
      name: role.name,
      description: role.description,
      usersCount: role._count.userRoles,
      permissionsCount: role._count.rolePermissions,
    },
  });
}

export async function getRolePermissions(req: Request, res: Response) {
  const roleId = parseInt(String(req.params.roleId));
  const rps = await prisma.rolePermission.findMany({
    where: { roleId },
    select: { permissionId: true },
  });
  res.json({ data: rps.map(rp => rp.permissionId) });
}

export async function updateRolePermissions(req: Request, res: Response) {
  const roleId = parseInt(String(req.params.roleId));
  const { permissionIds } = req.body as { permissionIds: number[] };

  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId } }),
    prisma.rolePermission.createMany({
      data: permissionIds.map(pid => ({ roleId, permissionId: pid })),
    }),
  ]);

  res.json({ success: true });
}

// ── Permissions ──

export async function listPermissionsGrouped(_req: Request, res: Response) {
  const perms = await prisma.permission.findMany({ orderBy: { id: 'asc' } });

  const groups: Record<string, { id: number; name: string; description: string | null; module: string }[]> = {};
  for (const p of perms) {
    if (!groups[p.module]) groups[p.module] = [];
    groups[p.module].push(p);
  }

  const data = Object.entries(groups).map(([module, permissions]) => ({ module, permissions }));
  res.json({ data });
}

export async function listAllPermissions(_req: Request, res: Response) {
  const data = await prisma.permission.findMany({ orderBy: { id: 'asc' } });
  res.json({ data });
}

// ── Modules ──

export async function listModules(_req: Request, res: Response) {
  const data = await prisma.module.findMany({ orderBy: { displayOrder: 'asc' } });
  res.json({ data });
}
