import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import * as ctrl from './reports.controller';

const router = Router();

router.use(authMiddleware);

router.get('/company/:companyId', rbac('dashboard:read'), ctrl.downloadReport);
router.get('/trainings/:companyId', rbac('dashboard:read'), ctrl.downloadTrainingsReport);
router.get('/audits/:companyId', rbac('dashboard:read'), ctrl.downloadAuditsReport);
router.get('/implementation/:companyId', rbac('dashboard:read'), ctrl.downloadImplementationReport);

export default router;
