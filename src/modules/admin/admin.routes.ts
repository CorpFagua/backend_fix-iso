import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import * as ctrl from './admin.controller';

const router = Router();

router.use(authMiddleware);

// Roles
router.get('/roles', ctrl.listRoles);
router.post('/roles', ctrl.createRole);
router.put('/roles/:id', ctrl.updateRole);
router.get('/roles/:roleId/permissions', ctrl.getRolePermissions);
router.put('/roles/:roleId/permissions', ctrl.updateRolePermissions);

// Permissions
router.get('/permissions', ctrl.listPermissionsGrouped);
router.get('/permissions/all', ctrl.listAllPermissions);

// Modules
router.get('/modules', ctrl.listModules);

export default router;
