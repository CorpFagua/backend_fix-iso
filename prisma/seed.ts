import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ──────────────────────────────────────────────
  // 1. PERMISSIONS
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
    { name: 'modules:manage', description: 'Gestionar módulos del sistema', module: 'modules' },
    { name: 'permissions:manage', description: 'Gestionar permisos del sistema', module: 'permissions' },
    // Implementation module
    { name: 'implementation:read', description: 'Ver implementación de controles ISO', module: 'implementation' },
    { name: 'implementation:update', description: 'Actualizar tareas y progreso de implementación', module: 'implementation' },
    { name: 'implementation:notes', description: 'Gestionar notas de seguimiento de implementación', module: 'implementation' },
    { name: 'implementation:delete', description: 'Eliminar datos de implementación', module: 'implementation' },
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
    admin: permissions.filter(p => p.module !== 'audit_log' && p.module !== 'modules' && p.module !== 'permissions').map(p => p.name),
    auditor: [
      'dashboard:read', 'companies:read', 'controls:read', 'controls:export', 'soa:read',
      'assets:read', 'audits:read', 'audits:create', 'audits:update',
      'risk:read', 'evidence:read', 'notifications:read',
      'implementation:read',
    ],
    consultant: [
      'dashboard:read', 'companies:read', 'controls:read', 'controls:update', 'controls:export',
      'soa:read', 'soa:update', 'assets:read', 'assets:create', 'assets:update',
      'risk:read', 'risk:create', 'risk:update', 'evidence:read', 'evidence:create',
      'notifications:read',
      'implementation:read', 'implementation:update', 'implementation:notes',
    ],
    employee: [
      'dashboard:read', 'controls:read', 'assets:read', 'evidence:read',
      'evidence:create', 'notifications:read',
      'implementation:read',
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
    { id: 2, name: 'Implementación', route: '/implementation', icon: 'SafetyOutlined', parentId: null, displayOrder: 3 },
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
    { id: 9, name: 'Catálogo ISO', route: '/catalog', icon: 'BookOutlined', parentId: 5, displayOrder: 3 },
    { id: 10, name: 'Módulos y Permisos', route: '/admin/modules', icon: 'AppstoreOutlined', parentId: 5, displayOrder: 4 },
  ];

  for (const m of childModules) {
    await prisma.module.upsert({
      where: { id: m.id },
      update: { name: m.name, route: m.route, icon: m.icon, parentId: m.parentId, displayOrder: m.displayOrder },
      create: m,
    });
  }
  console.log('  ✓ 10 modules');

  // ──────────────────────────────────────────────
  // 5. MODULE_PERMISSIONS
  //    Maps which permission(s) grant access to see each module in sidebar
  // ──────────────────────────────────────────────
  const modulePermissionsMap: Record<number, string[]> = {
    1: ['dashboard:read'],                              // Dashboard
    8: ['companies:read'],                              // Empresas
    2: ['implementation:read'],                          // Implementación
    3: ['soa:read'],                                    // SoA
    4: ['assets:read'],                                 // Activos
    5: ['users:read', 'roles:read', 'controls:update', 'modules:manage'], // Administración
    6: ['users:read'],                                  // Usuarios (child)
    7: ['roles:read'],                                  // Roles y Permisos (child)
    9: ['controls:update'],                             // Catálogo ISO (child)
    10: ['modules:manage'],                              // Módulos y Permisos (child)
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
  // 7. SECTORS
  // ──────────────────────────────────────────────
  const sectorsData = [
    { id: 1, name: 'Tecnología', description: 'Empresas de software, hardware y servicios TI' },
    { id: 2, name: 'Financiero', description: 'Banca, seguros y servicios financieros' },
    { id: 3, name: 'Salud', description: 'Hospitales, clínicas y laboratorios' },
    { id: 4, name: 'Gobierno', description: 'Entidades gubernamentales y del sector público' },
    { id: 5, name: 'Educación', description: 'Universidades, colegios e instituciones educativas' },
    { id: 6, name: 'Manufactura', description: 'Industria manufacturera y producción' },
    { id: 7, name: 'Retail', description: 'Comercio minorista y distribución' },
  ];

  for (const s of sectorsData) {
    await prisma.sector.upsert({
      where: { name: s.name },
      update: {},
      create: s,
    });
  }
  console.log(`  ✓ ${sectorsData.length} sectors`);

  // ──────────────────────────────────────────────
  // 8. COMPANY SIZES
  // ──────────────────────────────────────────────
  const companySizesData = [
    { id: 1, name: 'Micro', minEmployees: 1, maxEmployees: 10 },
    { id: 2, name: 'Pequeña', minEmployees: 11, maxEmployees: 50 },
    { id: 3, name: 'Mediana', minEmployees: 51, maxEmployees: 200 },
    { id: 4, name: 'Grande', minEmployees: 201, maxEmployees: null },
  ];

  for (const cs of companySizesData) {
    await prisma.companySize.upsert({
      where: { name: cs.name },
      update: {},
      create: cs,
    });
  }
  console.log(`  ✓ ${companySizesData.length} company sizes`);

  // ──────────────────────────────────────────────
  // 9. COMPANIES
  // ──────────────────────────────────────────────
  const companiesData = [
    { id: 1, name: 'TechCorp Solutions S.A.S.', sectorId: 1, sizeId: 4, country: 'Colombia', status: 'active', createdBy: 1, createdAt: new Date('2025-06-01T00:00:00Z'), engagementStart: new Date('2025-06-01') },
    { id: 2, name: 'Financiera del Valle S.A.', sectorId: 2, sizeId: 3, country: 'Colombia', status: 'active', createdBy: 1, createdAt: new Date('2025-08-15T00:00:00Z'), engagementStart: new Date('2025-08-15') },
    { id: 3, name: 'Hospital San Rafael', sectorId: 3, sizeId: 4, country: 'Colombia', status: 'active', createdBy: 1, createdAt: new Date('2025-10-01T00:00:00Z'), engagementStart: new Date('2025-10-01') },
  ];

  for (const c of companiesData) {
    await prisma.company.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    });
  }
  console.log(`  ✓ ${companiesData.length} companies`);

  // ──────────────────────────────────────────────
  // 10. COMPANY SERVICES
  // ──────────────────────────────────────────────
  const companyServicesData = [
    { companyId: 1, serviceType: 'implementation', status: 'active', startDate: new Date('2025-06-01'), notes: 'Implementación completa ISO 27001:2022' },
    { companyId: 1, serviceType: 'training', status: 'active', startDate: new Date('2025-07-01'), notes: 'Capacitación en seguridad para personal TI' },
    { companyId: 2, serviceType: 'implementation', status: 'active', startDate: new Date('2025-08-15'), notes: 'Implementación ISO 27001 sector financiero' },
    { companyId: 2, serviceType: 'audit', status: 'active', startDate: new Date('2025-11-01'), notes: 'Auditoría interna pre-certificación' },
    { companyId: 3, serviceType: 'comprehensive', status: 'active', startDate: new Date('2025-10-01'), notes: 'Servicio integral: implementación + auditoría + capacitación' },
  ];

  for (const cs of companyServicesData) {
    await prisma.companyService.upsert({
      where: { companyId_serviceType: { companyId: cs.companyId, serviceType: cs.serviceType } },
      update: {},
      create: cs,
    });
  }
  console.log(`  ✓ ${companyServicesData.length} company services`);

  // ──────────────────────────────────────────────
  // 11. COMPANY USERS
  // ──────────────────────────────────────────────
  const companyUsersData = [
    { companyId: 1, userId: 1, roleInCompany: 'Líder de implementación', assignedAt: new Date('2025-06-01') },
    { companyId: 1, userId: 2, roleInCompany: 'CISO', assignedAt: new Date('2025-06-01') },
    { companyId: 1, userId: 4, roleInCompany: 'Consultora ISO', assignedAt: new Date('2025-06-15') },
    { companyId: 1, userId: 5, roleInCompany: 'Responsable TI', assignedAt: new Date('2025-07-01') },
    { companyId: 2, userId: 1, roleInCompany: 'Líder de implementación', assignedAt: new Date('2025-08-15') },
    { companyId: 2, userId: 3, roleInCompany: 'Auditor interno', assignedAt: new Date('2025-08-20') },
    { companyId: 2, userId: 4, roleInCompany: 'Consultora ISO', assignedAt: new Date('2025-09-01') },
    { companyId: 3, userId: 1, roleInCompany: 'Líder de implementación', assignedAt: new Date('2025-10-01') },
    { companyId: 3, userId: 2, roleInCompany: 'DPO', assignedAt: new Date('2025-10-10') },
  ];

  for (const cu of companyUsersData) {
    await prisma.companyUser.upsert({
      where: { companyId_userId: { companyId: cu.companyId, userId: cu.userId } },
      update: {},
      create: cu,
    });
  }
  console.log(`  ✓ ${companyUsersData.length} company-user assignments`);

  // ──────────────────────────────────────────────
  // 12. ISO THEMES
  // ──────────────────────────────────────────────
  const isoThemesData = [
    { id: 1, name: 'Organizational', description: 'Controles organizacionales (A.5)' },
    { id: 2, name: 'People', description: 'Controles de personas (A.6)' },
    { id: 3, name: 'Physical', description: 'Controles físicos (A.7)' },
    { id: 4, name: 'Technological', description: 'Controles tecnológicos (A.8)' },
  ];

  for (const t of isoThemesData) {
    await prisma.isoTheme.upsert({
      where: { name: t.name },
      update: {},
      create: t,
    });
  }
  console.log(`  ✓ ${isoThemesData.length} ISO themes`);

  // ──────────────────────────────────────────────
  // 13. ISO CONTROLS (93 — ISO 27001:2022 Annex A)
  // ──────────────────────────────────────────────
  const isoControlsData: { code: string; title: string; themeId: number; controlType: string; properties: string }[] = [
    // A.5 — Organizational (37)
    { code: 'A.5.1', title: 'Políticas de seguridad de la información', themeId: 1, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.5.2', title: 'Roles y responsabilidades de seguridad', themeId: 1, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.5.3', title: 'Segregación de funciones', themeId: 1, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.5.4', title: 'Responsabilidades de la dirección', themeId: 1, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.5.5', title: 'Contacto con autoridades', themeId: 1, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.5.6', title: 'Contacto con grupos de interés especial', themeId: 1, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.5.7', title: 'Inteligencia sobre amenazas', themeId: 1, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.5.8', title: 'Seguridad en gestión de proyectos', themeId: 1, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.5.9', title: 'Inventario de información y activos', themeId: 1, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.5.10', title: 'Uso aceptable de información y activos', themeId: 1, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.5.11', title: 'Devolución de activos', themeId: 1, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.5.12', title: 'Clasificación de la información', themeId: 1, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.5.13', title: 'Etiquetado de la información', themeId: 1, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.5.14', title: 'Transferencia de información', themeId: 1, controlType: 'preventive', properties: 'C,I' },
    { code: 'A.5.15', title: 'Control de acceso', themeId: 1, controlType: 'preventive', properties: 'C' },
    { code: 'A.5.16', title: 'Gestión de identidades', themeId: 1, controlType: 'preventive', properties: 'C' },
    { code: 'A.5.17', title: 'Información de autenticación', themeId: 1, controlType: 'preventive', properties: 'C' },
    { code: 'A.5.18', title: 'Derechos de acceso', themeId: 1, controlType: 'preventive', properties: 'C' },
    { code: 'A.5.19', title: 'Seguridad en relaciones con proveedores', themeId: 1, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.5.20', title: 'Seguridad en acuerdos con proveedores', themeId: 1, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.5.21', title: 'Gestión de seguridad en la cadena TIC', themeId: 1, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.5.22', title: 'Monitoreo y revisión de servicios de proveedores', themeId: 1, controlType: 'detective', properties: 'C,I,A' },
    { code: 'A.5.23', title: 'Seguridad para uso de servicios cloud', themeId: 1, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.5.24', title: 'Planificación de gestión de incidentes', themeId: 1, controlType: 'corrective', properties: 'C,I,A' },
    { code: 'A.5.25', title: 'Evaluación y decisión sobre eventos de seguridad', themeId: 1, controlType: 'detective', properties: 'C,I,A' },
    { code: 'A.5.26', title: 'Respuesta a incidentes de seguridad', themeId: 1, controlType: 'corrective', properties: 'C,I,A' },
    { code: 'A.5.27', title: 'Aprendizaje de incidentes de seguridad', themeId: 1, controlType: 'corrective', properties: 'C,I,A' },
    { code: 'A.5.28', title: 'Recolección de evidencia', themeId: 1, controlType: 'detective', properties: 'C,I,A' },
    { code: 'A.5.29', title: 'Seguridad durante disrupciones', themeId: 1, controlType: 'preventive', properties: 'A' },
    { code: 'A.5.30', title: 'Preparación TIC para continuidad del negocio', themeId: 1, controlType: 'preventive', properties: 'A' },
    { code: 'A.5.31', title: 'Requisitos legales y contractuales', themeId: 1, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.5.32', title: 'Derechos de propiedad intelectual', themeId: 1, controlType: 'preventive', properties: 'C' },
    { code: 'A.5.33', title: 'Protección de registros', themeId: 1, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.5.34', title: 'Privacidad y protección de datos personales', themeId: 1, controlType: 'preventive', properties: 'C' },
    { code: 'A.5.35', title: 'Revisión independiente de seguridad', themeId: 1, controlType: 'detective', properties: 'C,I,A' },
    { code: 'A.5.36', title: 'Cumplimiento de políticas y normas', themeId: 1, controlType: 'detective', properties: 'C,I,A' },
    { code: 'A.5.37', title: 'Procedimientos operativos documentados', themeId: 1, controlType: 'preventive', properties: 'C,I,A' },
    // A.6 — People (8)
    { code: 'A.6.1', title: 'Verificación de antecedentes', themeId: 2, controlType: 'preventive', properties: 'C' },
    { code: 'A.6.2', title: 'Términos y condiciones de empleo', themeId: 2, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.6.3', title: 'Concienciación y formación en seguridad', themeId: 2, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.6.4', title: 'Proceso disciplinario', themeId: 2, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.6.5', title: 'Responsabilidades tras el cese', themeId: 2, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.6.6', title: 'Acuerdos de confidencialidad', themeId: 2, controlType: 'preventive', properties: 'C' },
    { code: 'A.6.7', title: 'Trabajo remoto', themeId: 2, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.6.8', title: 'Reporte de eventos de seguridad', themeId: 2, controlType: 'detective', properties: 'C,I,A' },
    // A.7 — Physical (14)
    { code: 'A.7.1', title: 'Perímetros de seguridad física', themeId: 3, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.7.2', title: 'Controles de entrada física', themeId: 3, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.7.3', title: 'Seguridad de oficinas e instalaciones', themeId: 3, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.7.4', title: 'Monitoreo de seguridad física', themeId: 3, controlType: 'detective', properties: 'C,I,A' },
    { code: 'A.7.5', title: 'Protección contra amenazas ambientales', themeId: 3, controlType: 'preventive', properties: 'A' },
    { code: 'A.7.6', title: 'Trabajo en áreas seguras', themeId: 3, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.7.7', title: 'Escritorio y pantalla limpios', themeId: 3, controlType: 'preventive', properties: 'C' },
    { code: 'A.7.8', title: 'Ubicación y protección de equipos', themeId: 3, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.7.9', title: 'Seguridad de activos fuera de las instalaciones', themeId: 3, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.7.10', title: 'Medios de almacenamiento', themeId: 3, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.7.11', title: 'Servicios de soporte', themeId: 3, controlType: 'preventive', properties: 'A' },
    { code: 'A.7.12', title: 'Seguridad del cableado', themeId: 3, controlType: 'preventive', properties: 'C,A' },
    { code: 'A.7.13', title: 'Mantenimiento de equipos', themeId: 3, controlType: 'preventive', properties: 'I,A' },
    { code: 'A.7.14', title: 'Eliminación o reutilización segura de equipos', themeId: 3, controlType: 'preventive', properties: 'C' },
    // A.8 — Technological (34)
    { code: 'A.8.1', title: 'Dispositivos endpoint de usuario', themeId: 4, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.8.2', title: 'Derechos de acceso privilegiado', themeId: 4, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.8.3', title: 'Restricción de acceso a la información', themeId: 4, controlType: 'preventive', properties: 'C' },
    { code: 'A.8.4', title: 'Acceso al código fuente', themeId: 4, controlType: 'preventive', properties: 'C,I' },
    { code: 'A.8.5', title: 'Autenticación segura', themeId: 4, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.8.6', title: 'Gestión de capacidad', themeId: 4, controlType: 'preventive', properties: 'A' },
    { code: 'A.8.7', title: 'Protección contra malware', themeId: 4, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.8.8', title: 'Gestión de vulnerabilidades técnicas', themeId: 4, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.8.9', title: 'Gestión de configuración', themeId: 4, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.8.10', title: 'Eliminación de información', themeId: 4, controlType: 'preventive', properties: 'C' },
    { code: 'A.8.11', title: 'Enmascaramiento de datos', themeId: 4, controlType: 'preventive', properties: 'C' },
    { code: 'A.8.12', title: 'Prevención de fuga de datos', themeId: 4, controlType: 'preventive', properties: 'C' },
    { code: 'A.8.13', title: 'Respaldo de la información', themeId: 4, controlType: 'corrective', properties: 'I,A' },
    { code: 'A.8.14', title: 'Redundancia de instalaciones de procesamiento', themeId: 4, controlType: 'preventive', properties: 'A' },
    { code: 'A.8.15', title: 'Registro de eventos (logging)', themeId: 4, controlType: 'detective', properties: 'C,I,A' },
    { code: 'A.8.16', title: 'Actividades de monitoreo', themeId: 4, controlType: 'detective', properties: 'C,I,A' },
    { code: 'A.8.17', title: 'Sincronización de relojes', themeId: 4, controlType: 'detective', properties: 'I' },
    { code: 'A.8.18', title: 'Uso de programas utilitarios privilegiados', themeId: 4, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.8.19', title: 'Instalación de software en sistemas operativos', themeId: 4, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.8.20', title: 'Seguridad de redes', themeId: 4, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.8.21', title: 'Seguridad de servicios de red', themeId: 4, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.8.22', title: 'Segregación de redes', themeId: 4, controlType: 'preventive', properties: 'C,I' },
    { code: 'A.8.23', title: 'Filtrado web', themeId: 4, controlType: 'preventive', properties: 'C' },
    { code: 'A.8.24', title: 'Uso de criptografía', themeId: 4, controlType: 'preventive', properties: 'C,I' },
    { code: 'A.8.25', title: 'Ciclo de vida de desarrollo seguro', themeId: 4, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.8.26', title: 'Requisitos de seguridad de aplicaciones', themeId: 4, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.8.27', title: 'Principios de arquitectura e ingeniería segura', themeId: 4, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.8.28', title: 'Codificación segura', themeId: 4, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.8.29', title: 'Pruebas de seguridad en desarrollo y aceptación', themeId: 4, controlType: 'detective', properties: 'C,I,A' },
    { code: 'A.8.30', title: 'Desarrollo tercerizado', themeId: 4, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.8.31', title: 'Separación de entornos de desarrollo, pruebas y producción', themeId: 4, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.8.32', title: 'Gestión de cambios', themeId: 4, controlType: 'preventive', properties: 'C,I,A' },
    { code: 'A.8.33', title: 'Información de pruebas', themeId: 4, controlType: 'preventive', properties: 'C' },
    { code: 'A.8.34', title: 'Protección de sistemas durante pruebas de auditoría', themeId: 4, controlType: 'preventive', properties: 'C,I,A' },
  ];

  for (const ctrl of isoControlsData) {
    await prisma.isoControl.upsert({
      where: { code: ctrl.code },
      update: {},
      create: ctrl,
    });
  }
  console.log(`  ✓ ${isoControlsData.length} ISO 27001:2022 controls`);

  // ──────────────────────────────────────────────
  // 13. CONTROL APPLICABILITY RULES (sector + size combinations)
  // ──────────────────────────────────────────────
  // Dynamic import of control applicability rules
  const { generateControlApplicabilityRules } = await import('./data/controlApplicabilityRules.js');
  const applicabilityRules = generateControlApplicabilityRules();

  for (const rule of applicabilityRules) {
    await prisma.controlApplicability.upsert({
      where: {
        controlId_sectorId_sizeId: {
          controlId: rule.controlId,
          sectorId: rule.sectorId,
          sizeId: rule.sizeId,
        },
      },
      update: {},
      create: rule,
    });
  }
  console.log(`  ✓ ${applicabilityRules.length} control applicability rules`);

  // ──────────────────────────────────────────────
  // 14. STATEMENT OF APPLICABILITY (SoA) — TechCorp: all 93 applicable
  // ──────────────────────────────────────────────
  for (let i = 0; i < isoControlsData.length; i++) {
    await prisma.statementOfApplicability.upsert({
      where: { companyId_controlId: { companyId: 1, controlId: i + 1 } },
      update: {},
      create: {
        companyId: 1,
        controlId: i + 1,
        applicable: true,
        justification: 'Aplicable según análisis de riesgos',
        implementationStatus: i < 20 ? 'implemented' : i < 50 ? 'in_progress' : 'not_started',
      },
    });
  }
  console.log('  ✓ 93 SoA entries for TechCorp');

  // ──────────────────────────────────────────────
  // 15. COMPANY CONTROLS — TechCorp: first 30 with varied statuses
  // ──────────────────────────────────────────────
  const statusDistribution = [
    ...Array(10).fill({ status: 'implemented', maturityLevel: 'optimized', compliancePercentage: 100 }),
    ...Array(5).fill({ status: 'implemented', maturityLevel: 'managed', compliancePercentage: 85 }),
    ...Array(5).fill({ status: 'in_progress', maturityLevel: 'defined', compliancePercentage: 60 }),
    ...Array(5).fill({ status: 'in_progress', maturityLevel: 'initial', compliancePercentage: 30 }),
    ...Array(5).fill({ status: 'pending', maturityLevel: 'initial', compliancePercentage: 0 }),
  ];

  for (let i = 0; i < 30; i++) {
    const dist = statusDistribution[i];
    await prisma.companyControl.upsert({
      where: { companyId_controlId: { companyId: 1, controlId: i + 1 } },
      update: {},
      create: {
        companyId: 1,
        controlId: i + 1,
        status: dist.status,
        maturityLevel: dist.maturityLevel,
        compliancePercentage: dist.compliancePercentage,
        assignedUserId: [1, 2, 4, 5][i % 4],
        implementationDate: dist.status === 'implemented' ? new Date('2026-01-15') : null,
        reviewDate: dist.status === 'implemented' ? new Date('2026-07-15') : null,
      },
    });
  }
  console.log('  ✓ 30 company controls for TechCorp');

  // ──────────────────────────────────────────────
  // 16. ASSETS — demo assets for TechCorp
  // ──────────────────────────────────────────────
  const assetsData = [
    { companyId: 1, name: 'Servidor principal de producción', assetType: 'hardware', classification: 'confidential', ownerId: 2, custodianId: 5, location: 'Data center principal', status: 'active' },
    { companyId: 1, name: 'Base de datos de clientes', assetType: 'information', classification: 'restricted', ownerId: 2, custodianId: 5, location: 'Servidor principal', status: 'active' },
    { companyId: 1, name: 'ERP Corporativo', assetType: 'software', classification: 'internal', ownerId: 2, custodianId: 5, location: 'Cloud AWS', status: 'active' },
    { companyId: 1, name: 'Red corporativa VLAN-01', assetType: 'network', classification: 'internal', ownerId: 5, custodianId: null, location: 'Oficina central', status: 'active' },
    { companyId: 1, name: 'Laptops equipo desarrollo', assetType: 'hardware', classification: 'internal', ownerId: 4, custodianId: 5, location: 'Oficina TI', status: 'active' },
    { companyId: 1, name: 'Portal web público', assetType: 'software', classification: 'public', ownerId: 2, custodianId: 5, location: 'Cloud AWS', status: 'active' },
    { companyId: 1, name: 'Correo electrónico corporativo', assetType: 'service', classification: 'internal', ownerId: 2, custodianId: 5, location: 'Microsoft 365', status: 'active' },
    { companyId: 1, name: 'Sistema de backups', assetType: 'software', classification: 'confidential', ownerId: 5, custodianId: null, location: 'Data center principal', status: 'active' },
    { companyId: 1, name: 'Firewall perimetral', assetType: 'hardware', classification: 'restricted', ownerId: 5, custodianId: null, location: 'Data center principal', status: 'active' },
    { companyId: 1, name: 'Documentación SGSI', assetType: 'information', classification: 'internal', ownerId: 1, custodianId: 4, location: 'SharePoint', status: 'active' },
    { companyId: 1, name: 'VPN corporativa', assetType: 'service', classification: 'internal', ownerId: 5, custodianId: null, location: 'FortiGate', status: 'active' },
    { companyId: 1, name: 'Archivo físico contratos', assetType: 'physical', classification: 'confidential', ownerId: 2, custodianId: null, location: 'Archivo oficina central', status: 'active' },
    { companyId: 2, name: 'Core bancario', assetType: 'software', classification: 'restricted', ownerId: 3, custodianId: null, location: 'On-premise', status: 'active' },
    { companyId: 2, name: 'Base de datos transacciones', assetType: 'information', classification: 'restricted', ownerId: 3, custodianId: null, location: 'Oracle DB Server', status: 'active' },
    { companyId: 2, name: 'Sucursales – red WAN', assetType: 'network', classification: 'internal', ownerId: 3, custodianId: null, location: 'Nationwide', status: 'active' },
  ];

  for (const a of assetsData) {
    await prisma.asset.create({ data: a });
  }
  console.log(`  ✓ ${assetsData.length} assets`);

  // ──────────────────────────────────────────────
  // 17. ASSET RISK ASSESSMENTS — sample risks for TechCorp assets
  // ──────────────────────────────────────────────
  const risksData = [
    { assetId: 1, threat: 'Fallo de hardware', vulnerability: 'Servidor sin redundancia', likelihood: 3, impact: 5, riskScore: 15, riskLevel: 'high', treatment: 'mitigate', treatmentPlan: 'Implementar cluster de alta disponibilidad', residualRiskScore: 5, assessedBy: 4 },
    { assetId: 2, threat: 'Acceso no autorizado', vulnerability: 'Contraseñas débiles', likelihood: 4, impact: 5, riskScore: 20, riskLevel: 'critical', treatment: 'mitigate', treatmentPlan: 'MFA + política de contraseñas fuertes', residualRiskScore: 4, assessedBy: 4 },
    { assetId: 3, threat: 'Ransomware', vulnerability: 'Falta de parches actualizados', likelihood: 3, impact: 4, riskScore: 12, riskLevel: 'high', treatment: 'mitigate', treatmentPlan: 'Programa de gestión de parches', residualRiskScore: 4, assessedBy: 4 },
    { assetId: 4, threat: 'Intercepción de tráfico', vulnerability: 'Segmentos de red sin cifrado', likelihood: 2, impact: 4, riskScore: 8, riskLevel: 'medium', treatment: 'mitigate', treatmentPlan: 'Implementar 802.1X y cifrado', residualRiskScore: 3, assessedBy: 4 },
    { assetId: 9, threat: 'Bypass de reglas', vulnerability: 'Configuración por defecto', likelihood: 2, impact: 5, riskScore: 10, riskLevel: 'high', treatment: 'mitigate', treatmentPlan: 'Hardening y revisión periódica de reglas', residualRiskScore: 3, assessedBy: 4 },
  ];

  for (const r of risksData) {
    await prisma.assetRiskAssessment.create({ data: r });
  }
  console.log(`  ✓ ${risksData.length} asset risk assessments`);

  // ──────────────────────────────────────────────
  // 18. AUDIT — one completed audit for TechCorp
  // ──────────────────────────────────────────────
  const audit = await prisma.audit.create({
    data: {
      companyId: 1,
      auditorId: 3,
      date: new Date('2026-03-01'),
      status: 'completed',
      notes: 'Auditoría interna pre-certificación ISO 27001:2022',
    },
  });

  // Sample audit results for first 10 controls
  const auditResultStatuses = ['compliant', 'compliant', 'compliant', 'partial', 'compliant', 'compliant', 'non_compliant', 'compliant', 'partial', 'compliant'];
  for (let i = 0; i < 10; i++) {
    await prisma.auditResult.create({
      data: {
        auditId: audit.id,
        controlId: i + 1,
        result: auditResultStatuses[i],
        comments: auditResultStatuses[i] === 'non_compliant'
          ? 'No se encontró evidencia suficiente de implementación'
          : auditResultStatuses[i] === 'partial'
            ? 'Implementado parcialmente, requiere mejoras'
            : 'Control implementado correctamente',
      },
    });
  }
  console.log('  ✓ 1 audit with 10 results for TechCorp');

  // ──────────────────────────────────────────────
  // 19. RISK ASSESSMENTS — company-level assessments
  // ──────────────────────────────────────────────
  await prisma.riskAssessment.create({
    data: {
      companyId: 1,
      riskScore: 14.2,
      riskLevel: 'high',
      analysis: 'Evaluación de riesgos general. Se identificaron 5 riesgos críticos y 12 altos. Plan de tratamiento en ejecución.',
      methodology: 'ISO 27005',
      scope: 'Todos los activos de información',
      status: 'approved',
    },
  });
  await prisma.riskAssessment.create({
    data: {
      companyId: 2,
      riskScore: 18.5,
      riskLevel: 'critical',
      analysis: 'Evaluación inicial. Sector financiero con alto nivel de riesgo regulatorio. Requiere plan de tratamiento urgente.',
      methodology: 'ISO 27005',
      scope: 'Core bancario y activos financieros',
      status: 'draft',
    },
  });
  console.log('  ✓ 2 risk assessments');

  // ──────────────────────────────────────────────
  // 20. TRAININGS
  // ──────────────────────────────────────────────
  const training1 = await prisma.training.create({
    data: {
      companyId: 1,
      trainerId: 1,
      title: 'Fundamentos ISO 27001:2022',
      description: 'Capacitación introductoria sobre el SGSI y los requisitos de la norma ISO 27001:2022.',
      trainingType: 'awareness',
      date: new Date('2026-02-15'),
      status: 'completed',
    },
  });

  const training2 = await prisma.training.create({
    data: {
      companyId: 1,
      trainerId: 4,
      title: 'Gestión de riesgos de seguridad',
      description: 'Taller práctico sobre identificación, evaluación y tratamiento de riesgos.',
      trainingType: 'workshop',
      date: new Date('2026-04-10'),
      status: 'scheduled',
    },
  });

  // Training attendees (external client personnel)
  const attendeesT1 = [
    { trainingId: training1.id, attendeeName: 'Juan Pérez', attendeeEmail: 'juan.perez@techcorp.com', attended: true },
    { trainingId: training1.id, attendeeName: 'María López', attendeeEmail: 'maria.lopez@techcorp.com', attended: true },
    { trainingId: training1.id, attendeeName: 'Roberto Gómez', attendeeEmail: 'roberto.gomez@techcorp.com', attended: false },
    { trainingId: training1.id, attendeeName: 'Ana Martínez', attendeeEmail: 'ana.martinez@techcorp.com', attended: true },
  ];

  for (const att of attendeesT1) {
    await prisma.trainingAttendee.create({ data: att });
  }
  console.log('  ✓ 2 trainings with attendees');

  // ──────────────────────────────────────────────
  // 21. NOTIFICATIONS — sample notifications
  // ──────────────────────────────────────────────
  const notificationsData = [
    { userId: 1, title: 'Auditoría completada', message: 'La auditoría interna de TechCorp ha sido completada.', type: 'info', read: true, link: '/companies/1' },
    { userId: 1, title: 'Riesgo crítico detectado', message: 'Se identificó un riesgo crítico en el activo "Base de datos de clientes".', type: 'warning', read: false, link: '/assets' },
    { userId: 4, title: 'Control asignado', message: 'Se te ha asignado el control A.5.12 en TechCorp.', type: 'info', read: false, link: '/controls' },
    { userId: 2, title: 'Capacitación programada', message: 'Nueva capacitación "Gestión de riesgos" programada para el 10 de abril.', type: 'info', read: false, link: '/companies/1' },
    { userId: 3, title: 'Auditoría pendiente', message: 'Se requiere auditoría para Financiera del Valle.', type: 'action', read: false, link: '/companies/2' },
  ];

  for (const n of notificationsData) {
    await prisma.notification.create({ data: n });
  }
  console.log(`  ✓ ${notificationsData.length} notifications`);

  // ──────────────────────────────────────────────
  // Log initial audit entry
  // ──────────────────────────────────────────────
  await prisma.auditLog.create({
    data: {
      userId: 1,
      action: 'seed',
      entityType: 'system',
      newValues: { description: 'Initial database seed — auth + business data' },
    },
  });
  console.log('  ✓ audit_log initial entry');

  // ──────────────────────────────────────────────
  // Reset PostgreSQL sequences after seeding with explicit IDs
  // Without this, the next INSERT would try id=1 and fail with P2002
  // ──────────────────────────────────────────────
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('modules', 'id'), (SELECT MAX(id) FROM modules))`);
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('permissions', 'id'), (SELECT MAX(id) FROM permissions))`);
  await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT MAX(id) FROM users))`);
  console.log('  ✓ sequences reset');

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
