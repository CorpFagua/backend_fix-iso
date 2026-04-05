import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import * as ctrl from './implementation.controller';

// Mounted at /api/companies/:companyId/implementation
const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/summary', rbac('implementation:read'), ctrl.getSummary);
router.get('/', rbac('implementation:read'), ctrl.listControls);
router.get('/:controlId', rbac('implementation:read'), ctrl.getControlDetail);
router.put('/:controlId/tasks/:taskId', rbac('implementation:update'), ctrl.updateTask);
router.post('/:controlId/notes', rbac('implementation:notes'), ctrl.addNote);

export default router;
