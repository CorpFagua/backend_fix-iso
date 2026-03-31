import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import * as ctrl from './companies.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', ctrl.listCompanies);
router.get('/:id', ctrl.getCompany);
router.post('/', ctrl.createCompany);
router.put('/:id', ctrl.updateCompany);
router.delete('/:id', ctrl.deleteCompany);

router.get('/:companyId/users', ctrl.listCompanyUsers);
router.post('/:companyId/users', ctrl.addCompanyUser);
router.delete('/:companyId/users/:userId', ctrl.removeCompanyUser);

export default router;
