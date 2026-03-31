import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';

const router = Router();

router.use('/auth', authRoutes);

// Future modules will be mounted here:
// router.use('/users', usersRoutes);
// router.use('/companies', companiesRoutes);
// router.use('/controls', controlsRoutes);
// router.use('/assets', assetsRoutes);
// router.use('/dashboard', dashboardRoutes);

export default router;
