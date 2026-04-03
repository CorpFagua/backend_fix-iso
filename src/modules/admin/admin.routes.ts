import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import * as ctrl from './admin.controller';

const router = Router();

router.use(authMiddleware);

// Roles
router.get('/roles', rbac('roles:read'), ctrl.listRoles);
router.post('/roles', rbac('roles:create'), ctrl.createRole);
router.put('/roles/:id', rbac('roles:update'), ctrl.updateRole);
router.get('/roles/:roleId/permissions', rbac('roles:read'), ctrl.getRolePermissions);
router.put('/roles/:roleId/permissions', rbac('roles:update'), ctrl.updateRolePermissions);

// Permissions
router.get('/permissions', rbac('roles:read'), ctrl.listPermissionsGrouped);
router.get('/permissions/all', rbac('roles:read'), ctrl.listAllPermissions);
router.post('/permissions', rbac('permissions:manage'), ctrl.createPermission);
router.put('/permissions/:id', rbac('permissions:manage'), ctrl.updatePermission);
router.delete('/permissions/:id', rbac('permissions:manage'), ctrl.deletePermission);

// Modules
router.get('/modules', ctrl.listModules);
router.get('/modules/with-permissions', ctrl.listModulesWithPermissions);
router.post('/modules', rbac('modules:manage'), ctrl.createModule);
router.put('/modules/:id', rbac('modules:manage'), ctrl.updateModule);
router.delete('/modules/:id', rbac('modules:manage'), ctrl.deleteModule);

// User effective permissions
router.get('/users/:id/effective-permissions', rbac('users:read'), ctrl.getUserEffectivePermissions);

export default router;
