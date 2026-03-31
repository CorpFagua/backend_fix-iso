import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import * as ctrl from './dashboard.controller';

const router = Router();

router.use(authMiddleware);

router.get('/stats', ctrl.getStats);
router.get('/compliance-progress', ctrl.getComplianceProgress);
router.get('/risk-overview', ctrl.getRiskOverview);
router.get('/recent-activity', ctrl.getRecentActivity);
router.get('/global', ctrl.getGlobalSummary);

export default router;
