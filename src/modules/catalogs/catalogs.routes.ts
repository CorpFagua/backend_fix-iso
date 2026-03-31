import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import * as ctrl from './catalogs.controller';

const router = Router();

router.use(authMiddleware);

router.get('/sectors', ctrl.listSectors);
router.get('/company-sizes', ctrl.listCompanySizes);

export default router;
