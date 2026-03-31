import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import * as ctrl from './assets.controller';

// Company-scoped assets routes (mounted on /companies/:companyId)
const router = Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/assets', ctrl.listAssets);
router.get('/assets/:id', ctrl.getAsset);
router.post('/assets', ctrl.createAsset);
router.put('/assets/:id', ctrl.updateAsset);
router.delete('/assets/:id', ctrl.deleteAsset);
router.post('/assets/:assetId/risks', ctrl.createRisk);

export default router;
