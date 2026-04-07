import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import * as ctrl from './audits.controller';

// Mounted at /api/companies/:companyId
const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/audits', rbac('audits:read'), ctrl.listAudits);
router.post('/audits', rbac('audits:create'), ctrl.createAudit);
router.get('/audits/:auditId', rbac('audits:read'), ctrl.getAudit);
router.put('/audits/:auditId', rbac('audits:update'), ctrl.updateAudit);
router.delete('/audits/:auditId', rbac('audits:update'), ctrl.deleteAudit);
router.put('/audits/:auditId/results/:controlId', rbac('audits:update'), ctrl.updateResult);

export default router;
