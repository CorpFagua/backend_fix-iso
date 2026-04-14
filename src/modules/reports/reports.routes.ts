import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import * as ctrl from './reports.controller';

const router = Router();

router.use(authMiddleware);

router.get('/company/:companyId', rbac('dashboard:read'), ctrl.downloadReport);

export default router;
