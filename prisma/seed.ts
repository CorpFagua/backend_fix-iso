import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ──────────────────────────────────────────────
  // 1. PERMISSIONS (35 total — identical to frontend mockPermissions)
  // ──────────────────────────────────────────────
  const permissionsData = [
    { name: 'dashboard:read', description: 'Ver panel de control', module: 'dashboard' },
    { name: 'companies:read', description: 'Ver empresas', module: 'companies' },
    { name: 'companies:create', description: 'Crear empresas', module: 'companies' },
    { name: 'companies:update', description: 'Actualizar empresas', module: 'companies' },
    { name: 'companies:delete', description: 'Eliminar empresas', module: 'companies' },
    { name: 'controls:read', description: 'Ver controles ISO', module: 'controls' },
    { name: 'controls:create', description: 'Crear controles', module: 'controls' },
    { name: 'controls:update', description: 'Actualizar controles', module: 'controls' },
    { name: 'controls:delete', description: 'Eliminar controles', module: 'controls' },
    { name: 'controls:export', description: 'Exportar controles', module: 'controls' },
    { name: 'soa:read', description: 'Ver declaración de aplicabilidad', module: 'soa' },
    { name: 'soa:update', description: 'Actualizar declaración de aplicabilidad', module: 'soa' },
    { name: 'assets:read', description: 'Ver activos', module: 'assets' },
    { name: 'assets:create', description: 'Crear activos', module: 'assets' },
    { name: 'assets:update', description: 'Actualizar activos', module: 'assets' },
    { name: 'assets:delete', description: 'Eliminar activos', module: 'assets' },
    { name: 'users:read', description: 'Ver usuarios', module: 'users' },
    { name: 'users:create', description: 'Crear usuarios', module: 'users' },
    { name: 'users:update', description: 'Actualizar usuarios', module: 'users' },
    { name: 'users:delete', description: 'Desactivar usuarios', module: 'users' },
    { name: 'roles:read', description: 'Ver roles', module: 'roles' },
    { name: 'roles:create', description: 'Crear roles', module: 'roles' },
    { name: 'roles:update', description: 'Actualizar roles', module: 'roles' },
    { name: 'roles:delete', description: 'Eliminar roles', module: 'roles' },
    { name: 'audits:read', description: 'Ver auditorías', module: 'audits' },
    { name: 'audits:create', description: 'Crear auditorías', module: 'audits' },
    { name: 'audits:update', description: 'Actualizar auditorías', module: 'audits' },
    { name: 'risk:read', description: 'Ver evaluaciones de riesgo', module: 'risk' },
    { name: 'risk:create', description: 'Crear evaluaciones de riesgo', module: 'risk' },
    { name: 'risk:update', description: 'Actualizar evaluaciones de riesgo', module: 'risk' },
    { name: 'evidence:read', description: 'Ver evidencias', module: 'evidence' },
    { name: 'evidence:create', description: 'Subir evidencias', module: 'evidence' },
    { name: 'evidence:delete', description: 'Eliminar evidencias', module: 'evidence' },
    { name: 'audit_log:read', description: 'Ver registro de auditoría del sistema', module: 'audit_log' },
    { name: 'notifications:read', description: 'Ver notificaciones', module: 'notifications' },
  ];

  const permissions: { id: number; name: string; description: string | null; module: string }[] = [];
  for (const p of permissionsData) {
    const perm = await prisma.permission.upsert({
      where: { name: p.name },
      update: {},
      create: p,
    });
    permissions.push(perm);
  }
  console.log(`  ✓ ${permissions.length} permissions`);

  // Helper: get permission ID by name
  const permId = (name: string) => permissions.find(p => p.name === name)!.id;

  // ──────────────────────────────────────────────
  // 2. ROLES (5 — identical to frontend mockRoles)
  // ──────────────────────────────────────────────
  const rolesData = [
    { name: 'super_admin', description: 'Acceso total al sistema, gestión de plataforma' },
    { name: 'admin', description: 'Administrador de empresa, gestiona usuarios y configuración' },
    { name: 'auditor', description: 'Realiza auditorías internas, acceso de lectura amplio' },
    { name: 'consultant', description: 'Consultor ISO, gestiona controles, riesgos y SoA' },
    { name: 'employee', description: 'Empleado base, acceso limitado a tareas asignadas' },
  ];

  const roles: { id: number; name: string; description: string | null }[] = [];
  for (const r of rolesData) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: r,
    });
    roles.push(role);
  }
  console.log(`  ✓ ${roles.length} roles`);

  const roleId = (name: string) => roles.find(r => r.name === name)!.id;

  // ──────────────────────────────────────────────
  // 3. ROLE_PERMISSIONS (matching frontend mockRolePermissions)
  // ──────────────────────────────────────────────
  // super_admin: ALL permissions
  // admin: ALL except audit_log
  // auditor: specific read + audit crud
  // consultant: controls/soa/assets/risk management
  // employee: minimal read + evidence:create

  const rolePermissionsMap: Record<string, string[]> = {
    super_admin: permissions.map(p => p.name),
    admin: permissions.filter(p => p.module !== 'audit_log').map(p => p.name),
    auditor: [
      'dashboard:read', 'companies:read', 'controls:read', 'controls:export', 'soa:read',
      'assets:read', 'audits:read', 'audits:create', 'audits:update',
      'risk:read', 'evidence:read', 'notifications:read',
    ],
    consultant: [
      'dashboard:read', 'companies:read', 'controls:read', 'controls:update', 'controls:export',
      'soa:read', 'soa:update', 'assets:read', 'assets:create', 'assets:update',
      'risk:read', 'risk:create', 'risk:update', 'evidence:read', 'evidence:create',
      'notifications:read',
    ],
    employee: [
      'dashboard:read', 'controls:read', 'assets:read', 'evidence:read',
      'evidence:create', 'notifications:read',
    ],
  };

  for (const [roleName, permNames] of Object.entries(rolePermissionsMap)) {
    const rId = roleId(roleName);
    for (const pName of permNames) {
      const pId = permId(pName);
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: rId, permissionId: pId } },
        update: {},
        create: { roleId: rId, permissionId: pId },
      });
    }
  }
  console.log('  ✓ role_permissions assigned');

  // ──────────────────────────────────────────────
  // 4. MODULES (8 — identical to frontend allModules)
  // ──────────────────────────────────────────────
  const modulesData = [
    { id: 1, name: 'Dashboard', route: '/dashboard', icon: 'DashboardOutlined', parentId: null, displayOrder: 1 },
    { id: 8, name: 'Empresas', route: '/companies', icon: 'BankOutlined', parentId: null, displayOrder: 2 },
    { id: 2, name: 'Controles ISO', route: '/controls', icon: 'SafetyOutlined', parentId: null, displayOrder: 3 },
    { id: 3, name: 'Declaración de Aplicabilidad', route: '/soa', icon: 'FileProtectOutlined', parentId: null, displayOrder: 4 },
    { id: 4, name: 'Activos', route: '/assets', icon: 'DatabaseOutlined', parentId: null, displayOrder: 5 },
    { id: 5, name: 'Administración', route: '/admin', icon: 'SettingOutlined', parentId: null, displayOrder: 6 },
  ];

  // Insert parent modules first (no parentId dependency)
  for (const m of modulesData) {
    await prisma.module.upsert({
      where: { id: m.id },
      update: { name: m.name, route: m.route, icon: m.icon, displayOrder: m.displayOrder },
      create: m,
    });
  }

  // Child modules (depend on parent id=5)
  const childModules = [
    { id: 6, name: 'Usuarios', route: '/admin/users', icon: 'TeamOutlined', parentId: 5, displayOrder: 1 },
    { id: 7, name: 'Roles y Permisos', route: '/admin/roles', icon: 'LockOutlined', parentId: 5, displayOrder: 2 },
  ];

  for (const m of childModules) {
    await prisma.module.upsert({
      where: { id: m.id },
      update: { name: m.name, route: m.route, icon: m.icon, parentId: m.parentId, displayOrder: m.displayOrder },
      create: m,
    });
  }
  console.log('  ✓ 8 modules');

  // ──────────────────────────────────────────────
  // 5. MODULE_PERMISSIONS
  //    Maps which permission(s) grant access to see each module in sidebar
  // ──────────────────────────────────────────────
  const modulePermissionsMap: Record<number, string[]> = {
    1: ['dashboard:read'],                              // Dashboard
    8: ['companies:read'],                              // Empresas
    2: ['controls:read'],                               // Controles ISO
    3: ['soa:read'],                                    // SoA
    4: ['assets:read'],                                 // Activos
    5: ['users:read', 'roles:read'],                    // Administración
    6: ['users:read'],                                  // Usuarios (child)
    7: ['roles:read'],                                  // Roles y Permisos (child)
  };

  for (const [modId, permNames] of Object.entries(modulePermissionsMap)) {
    for (const pName of permNames) {
      const mId = parseInt(modId);
      const pId = permId(pName);
      await prisma.modulePermission.upsert({
        where: { moduleId_permissionId: { moduleId: mId, permissionId: pId } },
        update: {},
        create: { moduleId: mId, permissionId: pId },
      });
    }
  }
  console.log('  ✓ module_permissions assigned');

  // ──────────────────────────────────────────────
  // 6. USERS (6 — identical to frontend mockUsers)
  // ──────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Admin123!', 12);

  const usersData = [
    {
      id: 1, name: 'Carlos Mendoza', email: 'admin@fixiso.com',
      phone: '+57 310 555 1234', isActive: true, roleName: 'super_admin',
      lastLoginAt: new Date('2026-03-15T14:30:00Z'), createdAt: new Date('2025-01-10T08:00:00Z'),
    },
    {
      id: 2, name: 'Laura García', email: 'laura.garcia@empresa.com',
      phone: '+57 311 555 5678', isActive: true, roleName: 'admin',
      lastLoginAt: new Date('2026-03-14T09:15:00Z'), createdAt: new Date('2025-02-15T10:00:00Z'),
    },
    {
      id: 3, name: 'Andrés Rojas', email: 'andres.rojas@empresa.com',
      phone: '+57 312 555 9012', isActive: true, roleName: 'auditor',
      lastLoginAt: new Date('2026-03-13T16:45:00Z'), createdAt: new Date('2025-03-20T12:00:00Z'),
    },
    {
      id: 4, name: 'Diana Torres', email: 'diana.torres@empresa.com',
      phone: null, isActive: true, roleName: 'consultant',
      lastLoginAt: new Date('2026-03-12T11:00:00Z'), createdAt: new Date('2025-04-05T09:00:00Z'),
    },
    {
      id: 5, name: 'Miguel Sánchez', email: 'miguel.sanchez@empresa.com',
      phone: '+57 315 555 3456', isActive: true, roleName: 'employee',
      lastLoginAt: new Date('2026-03-10T08:30:00Z'), createdAt: new Date('2025-05-12T14:00:00Z'),
    },
    {
      id: 6, name: 'Paola Ramírez', email: 'paola.ramirez@empresa.com',
      phone: null, isActive: false, roleName: 'employee',
      lastLoginAt: new Date('2026-01-20T10:00:00Z'), createdAt: new Date('2025-06-01T08:00:00Z'),
    },
  ];

  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        name: u.name,
        email: u.email,
        password: passwordHash,
        phone: u.phone,
        isActive: u.isActive,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
      },
    });

    // Assign role
    const rId = roleId(u.roleName);
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: rId } },
      update: {},
      create: { userId: user.id, roleId: rId },
    });
  }
  console.log('  ✓ 6 users with role assignments');

  // ──────────────────────────────────────────────
  // Log initial audit entry
  // ──────────────────────────────────────────────
  await prisma.auditLog.create({
    data: {
      userId: 1,
      action: 'seed',
      entityType: 'system',
      newValues: { description: 'Initial database seed' },
    },
  });
  console.log('  ✓ audit_log initial entry');

  console.log('\nSeed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
