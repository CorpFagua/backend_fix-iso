import prisma from '../../config/database';
import { comparePassword } from '../../utils/password';
import { signAccessToken, generateRefreshToken } from '../../utils/jwt';
import { AppError } from '../../middleware/errorHandler';

interface AuthUserResponse {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  roles: string[];
  permissions: string[];
  modules: {
    id: number;
    name: string;
    route: string;
    icon: string;
    parentId: number | null;
    displayOrder: number;
  }[];
  assignedCompanyIds: number[];
}

function buildAuthUser(user: any): AuthUserResponse {
  const roles = user.userRoles.map((ur: any) => ur.role.name);
  const permissions = [
    ...new Set<string>(
      user.userRoles.flatMap((ur: any) =>
        ur.role.rolePermissions.map((rp: any) => rp.permission.name)
      )
    ),
  ];

  // Collect all permission IDs the user has
  const permissionIds = new Set<number>(
    user.userRoles.flatMap((ur: any) =>
      ur.role.rolePermissions.map((rp: any) => rp.permission.id)
    )
  );

  // Filter modules: user sees a module if they have at least one of its required permissions
  const modules = (user._modules ?? [])
    .filter((m: any) => {
      if (m.modulePermissions.length === 0) return true;
      return m.modulePermissions.some((mp: any) => permissionIds.has(mp.permissionId));
    })
    .map((m: any) => ({
      id: m.id,
      name: m.name,
      route: m.route,
      icon: m.icon,
      parentId: m.parentId,
      displayOrder: m.displayOrder,
    }));

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    roles,
    permissions,
    modules,
    assignedCompanyIds: [],
  };
}

const userInclude = {
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
};

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: userInclude,
  });

  if (!user) {
    throw new AppError(401, 'Credenciales inválidas');
  }

  if (!user.isActive) {
    throw new AppError(401, 'Cuenta desactivada');
  }

  const validPassword = await comparePassword(password, user.password);

  if (!validPassword) {
    const attempts = user.failedLoginAttempts + 1;
    const updateData: any = { failedLoginAttempts: attempts };
    if (attempts >= 5) {
      updateData.isActive = false;
    }
    await prisma.user.update({ where: { id: user.id }, data: updateData });
    throw new AppError(401, 'Credenciales inválidas');
  }

  // Reset failed attempts and update last login
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lastLoginAt: new Date(),
    },
  });

  const accessToken = signAccessToken(user.id, user.email);
  const refreshTokenValue = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshTokenValue,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // Fetch modules for the response
  const allModules = await prisma.module.findMany({
    include: { modulePermissions: true },
    orderBy: { displayOrder: 'asc' },
  });

  const userWithModules = { ...user, _modules: allModules };
  const authUser = buildAuthUser(userWithModules);

  return { accessToken, refreshToken: refreshTokenValue, user: authUser };
}

export async function refresh(refreshTokenValue: string) {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshTokenValue },
    include: { user: true },
  });

  if (!storedToken) {
    throw new AppError(401, 'Token inválido');
  }

  // If token was already revoked, possible theft — revoke ALL tokens for this user
  if (storedToken.revoked) {
    await prisma.refreshToken.updateMany({
      where: { userId: storedToken.userId },
      data: { revoked: true },
    });
    throw new AppError(401, 'Token revocado — todas las sesiones han sido cerradas por seguridad');
  }

  if (storedToken.expiresAt < new Date()) {
    throw new AppError(401, 'Token expirado');
  }

  // Revoke current token
  await prisma.refreshToken.update({
    where: { id: storedToken.id },
    data: { revoked: true },
  });

  // Generate new tokens
  const newAccessToken = signAccessToken(storedToken.userId, storedToken.user.email);
  const newRefreshTokenValue = generateRefreshToken();

  await prisma.refreshToken.create({
    data: {
      userId: storedToken.userId,
      token: newRefreshTokenValue,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshTokenValue };
}

export async function logout(refreshTokenValue: string) {
  await prisma.refreshToken.updateMany({
    where: { token: refreshTokenValue },
    data: { revoked: true },
  });
  return { message: 'Sesión cerrada' };
}

export async function getMe(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: userInclude,
  });

  if (!user) {
    throw new AppError(404, 'Usuario no encontrado');
  }

  const allModules = await prisma.module.findMany({
    include: { modulePermissions: true },
    orderBy: { displayOrder: 'asc' },
  });

  const userWithModules = { ...user, _modules: allModules };
  return buildAuthUser(userWithModules);
}
