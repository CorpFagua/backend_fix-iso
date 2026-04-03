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

// ── Permissions CRUD ──

export async function createPermission(req: Request, res: Response) {
  const { name, description, module } = req.body;
  const perm = await prisma.permission.create({
    data: { name, description, module },
  });
  res.status(201).json({ data: perm });
}

export async function updatePermission(req: Request, res: Response) {
  const id = parseInt(String(req.params.id));
  const { name, description, module } = req.body;
  const perm = await prisma.permission.update({
    where: { id },
    data: { name, description, module },
  });
  res.json({ data: perm });
}

export async function deletePermission(req: Request, res: Response) {
  const id = parseInt(String(req.params.id));
  const usedByRoles = await prisma.rolePermission.count({ where: { permissionId: id } });
  if (usedByRoles > 0) {
    res.status(409).json({ error: 'No se puede eliminar un permiso asignado a roles. Desasócielo primero.' });
    return;
  }
  await prisma.$transaction([
    prisma.modulePermission.deleteMany({ where: { permissionId: id } }),
    prisma.permission.delete({ where: { id } }),
  ]);
  res.status(204).end();
}

// ── Modules ──

export async function listModules(_req: Request, res: Response) {
  const data = await prisma.module.findMany({ orderBy: { displayOrder: 'asc' } });
  res.json({ data });
}

export async function listModulesWithPermissions(_req: Request, res: Response) {
  const data = await prisma.module.findMany({
    include: {
      modulePermissions: { select: { permissionId: true } },
    },
    orderBy: { displayOrder: 'asc' },
  });
  res.json({ data });
}

export async function createModule(req: Request, res: Response) {
  const { name, route, icon, parentId, displayOrder, permissionIds } = req.body;
  const mod = await prisma.module.create({
    data: {
      name,
      route,
      icon,
      parentId: parentId ?? null,
      displayOrder: displayOrder ?? 0,
      modulePermissions: {
        create: (permissionIds ?? []).map((pid: number) => ({ permissionId: pid })),
      },
    },
    include: { modulePermissions: { select: { permissionId: true } } },
  });
  res.status(201).json({ data: mod });
}

export async function updateModule(req: Request, res: Response) {
  const id = parseInt(String(req.params.id));
  const { name, route, icon, parentId, displayOrder, permissionIds } = req.body;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (route !== undefined) updateData.route = route;
  if (icon !== undefined) updateData.icon = icon;
  if (parentId !== undefined) updateData.parentId = parentId;
  if (displayOrder !== undefined) updateData.displayOrder = displayOrder;

  const mod = await prisma.$transaction(async (tx) => {
    if (permissionIds !== undefined) {
      await tx.modulePermission.deleteMany({ where: { moduleId: id } });
      if (permissionIds.length > 0) {
        await tx.modulePermission.createMany({
          data: permissionIds.map((pid: number) => ({ moduleId: id, permissionId: pid })),
        });
      }
    }
    return tx.module.update({
      where: { id },
      data: updateData,
      include: { modulePermissions: { select: { permissionId: true } } },
    });
  });

  res.json({ data: mod });
}

export async function deleteModule(req: Request, res: Response) {
  const id = parseInt(String(req.params.id));
  const children = await prisma.module.count({ where: { parentId: id } });
  if (children > 0) {
    res.status(409).json({ error: 'No se puede eliminar un módulo con submódulos. Elimine los hijos primero.' });
    return;
  }
  await prisma.$transaction([
    prisma.modulePermission.deleteMany({ where: { moduleId: id } }),
    prisma.module.delete({ where: { id } }),
  ]);
  res.status(204).end();
}

// ── User Effective Permissions ──

export async function getUserEffectivePermissions(req: Request, res: Response) {
  const userId = parseInt(String(req.params.id));
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: { select: { permissionId: true, permission: { select: { name: true } } } },
            },
          },
        },
      },
    },
  });

  if (!user) {
    res.status(404).json({ error: 'Usuario no encontrado' });
    return;
  }

  const permissionIds = [
    ...new Set(
      user.userRoles.flatMap(ur => ur.role.rolePermissions.map(rp => rp.permissionId))
    ),
  ];

  const permissionNames = [
    ...new Set(
      user.userRoles.flatMap(ur => ur.role.rolePermissions.map(rp => rp.permission.name))
    ),
  ];

  const allModules = await prisma.module.findMany({
    include: { modulePermissions: { select: { permissionId: true } } },
    orderBy: { displayOrder: 'asc' },
  });

  const permIdSet = new Set(permissionIds);
  const modules = allModules
    .filter(m => {
      if (m.modulePermissions.length === 0) return true;
      return m.modulePermissions.some(mp => permIdSet.has(mp.permissionId));
    })
    .map(m => ({
      id: m.id,
      name: m.name,
      route: m.route,
      icon: m.icon,
      parentId: m.parentId,
      displayOrder: m.displayOrder,
    }));

  res.json({ data: { permissionIds, permissions: permissionNames, modules } });
}
