import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import * as ctrl from './controls.controller';

const router = Router();

router.use(authMiddleware);

// ISO Catalog (no company scope)
router.get('/themes', ctrl.listThemes);
router.get('/applicability', ctrl.listApplicabilityRules);
router.put('/applicability/:id', ctrl.updateApplicabilityRule);
router.delete('/applicability/:id', ctrl.deleteApplicabilityRule);
router.get('/', ctrl.listCatalogControls);
router.get('/:id', ctrl.getCatalogControl);
router.put('/:id', ctrl.updateCatalogControlHandler);

export default router;

// Company-scoped controls routes (mounted on /companies/:companyId)
export const companyControlsRouter = Router({ mergeParams: true });
companyControlsRouter.use(authMiddleware);

companyControlsRouter.get('/controls', ctrl.listCompanyControls);
companyControlsRouter.post('/controls', ctrl.assignControl);
companyControlsRouter.put('/controls/:controlId', ctrl.updateCompanyControl);
companyControlsRouter.delete('/controls/:controlId', ctrl.removeControl);
companyControlsRouter.get('/soa', ctrl.listSoA);
companyControlsRouter.put('/soa/:controlId', ctrl.updateSoA);

// Auto-generation routes
companyControlsRouter.post('/generate-controls', ctrl.generateControls);
companyControlsRouter.post('/regenerate-controls', ctrl.regenerateControls);
