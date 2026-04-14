import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import companiesRoutes from '../modules/companies/companies.routes';
import catalogsRoutes from '../modules/catalogs/catalogs.routes';
import controlsRoutes, { companyControlsRouter } from '../modules/controls/controls.routes';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';
import usersRoutes from '../modules/users/users.routes';
import adminRoutes from '../modules/admin/admin.routes';
import assetsRoutes from '../modules/assets/assets.routes';
import implementationRoutes from '../modules/implementation/implementation.routes';
import auditsRoutes from '../modules/audits/audits.routes';
import { trainingsAdminRouter, trainingsCompanyRouter } from '../modules/trainings/trainings.routes';
import bigdataRoutes from '../modules/bigdata/bigdata.routes';
import documentsRoutes from '../modules/documents/documents.routes';
import reportsRoutes from '../modules/reports/reports.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/companies', companiesRoutes);
router.use('/companies/:companyId', companyControlsRouter);
router.use('/companies/:companyId', assetsRoutes);
router.use('/companies/:companyId', auditsRoutes);
router.use('/companies/:companyId/implementation', implementationRoutes);
router.use('/companies/:companyId', trainingsCompanyRouter);
router.use('/catalogs', catalogsRoutes);
router.use('/controls', controlsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', usersRoutes);
router.use('/bigdata', bigdataRoutes);
router.use('/documents', documentsRoutes);
router.use('/reports', reportsRoutes);
router.use('/', adminRoutes);
router.use('/', trainingsAdminRouter);

export default router;
