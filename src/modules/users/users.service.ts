import prisma from '../../config/database';

interface UsersFilter {
  page: number;
  limit: number;
  search?: string;
}

export async function getUsers(filter: UsersFilter) {
  const where: Record<string, unknown> = {};
  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: 'insensitive' } },
      { email: { contains: filter.search, mode: 'insensitive' } },
    ];
  }

  const [total, items] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: {
        userRoles: {
          include: { role: { select: { id: true, name: true } } },
        },
      },
      skip: (filter.page - 1) * filter.limit,
      take: filter.limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    data: items.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      avatarUrl: u.avatarUrl,
      isActive: u.isActive,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
      roles: u.userRoles.map(ur => ({ id: ur.role.id, name: ur.role.name })),
    })),
    meta: {
      page: filter.page,
      limit: filter.limit,
      total,
      totalPages: Math.ceil(total / filter.limit),
    },
  };
}

export async function getUserById(id: number) {
  const u = await prisma.user.findUnique({
    where: { id },
    include: {
      userRoles: {
        include: { role: { select: { id: true, name: true } } },
      },
    },
  });
  if (!u) return null;

  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    avatarUrl: u.avatarUrl,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
    roles: u.userRoles.map(ur => ({ id: ur.role.id, name: ur.role.name })),
  };
}

export async function createUser(data: { name: string; email: string; password: string; phone?: string; roleIds: number[] }) {
  const bcrypt = await import('bcryptjs');
  const hash = await bcrypt.hash(data.password, 12);

  const u = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hash,
      phone: data.phone ?? null,
      userRoles: {
        create: data.roleIds.map(roleId => ({ roleId })),
      },
    },
    include: {
      userRoles: {
        include: { role: { select: { id: true, name: true } } },
      },
    },
  });

  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    avatarUrl: u.avatarUrl,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
    roles: u.userRoles.map(ur => ({ id: ur.role.id, name: ur.role.name })),
  };
}

export async function updateUser(id: number, data: { name?: string; email?: string; phone?: string; isActive?: boolean; roleIds?: number[] }) {
  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  if (data.roleIds) {
    await prisma.userRole.deleteMany({ where: { userId: id } });
    await prisma.userRole.createMany({
      data: data.roleIds.map(roleId => ({ userId: id, roleId })),
    });
  }

  const u = await prisma.user.update({
    where: { id },
    data: updateData,
    include: {
      userRoles: {
        include: { role: { select: { id: true, name: true } } },
      },
    },
  });

  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    avatarUrl: u.avatarUrl,
    isActive: u.isActive,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
    roles: u.userRoles.map(ur => ({ id: ur.role.id, name: ur.role.name })),
  };
}

export async function deactivateUser(id: number) {
  await prisma.user.update({ where: { id }, data: { isActive: false } });
}
