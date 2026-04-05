import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import * as ctrl from './implementation.controller';

// Mounted at /api/companies/:companyId/implementation
const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/summary', ctrl.getSummary);
router.get('/', ctrl.listControls);
router.get('/:controlId', ctrl.getControlDetail);
router.put('/:controlId/tasks/:taskId', ctrl.updateTask);
router.post('/:controlId/notes', ctrl.addNote);

export default router;
