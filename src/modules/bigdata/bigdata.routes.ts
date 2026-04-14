import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import * as ctrl from './bigdata.controller';

const router = Router();

router.use(authMiddleware);

router.get('/health', ctrl.getHealth);
router.get('/threat-map', ctrl.getThreatMap);
router.get('/threat-timeline', ctrl.getThreatTimeline);
router.get('/mitre-iso-correlation', ctrl.getMitreIsoCorrelation);
router.get('/company-risk-score', ctrl.getCompanyRiskScore);
router.post('/run-pipeline', ctrl.runPipeline);

export default router;
