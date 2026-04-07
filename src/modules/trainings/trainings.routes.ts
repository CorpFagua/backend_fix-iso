import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import * as ctrl from './trainings.controller';

// ─── Admin routes (global trainings CRUD) ───────────
const adminRouter = Router();
adminRouter.use(authMiddleware);

adminRouter.get('/trainings', rbac('trainings:read'), ctrl.listTrainings);
adminRouter.get('/trainings/:id', rbac('trainings:read'), ctrl.getTraining);
adminRouter.post('/trainings', rbac('trainings:create'), ctrl.createTraining);
adminRouter.put('/trainings/:id', rbac('trainings:update'), ctrl.updateTraining);
adminRouter.delete('/trainings/:id', rbac('trainings:delete'), ctrl.deleteTraining);

// ─── Company-scoped routes ──────────────────────────
const companyRouter = Router({ mergeParams: true });
companyRouter.use(authMiddleware);

companyRouter.get('/trainings', rbac('trainings:read'), ctrl.listCompanyTrainings);
companyRouter.get('/trainings/available', rbac('trainings:assign', 'trainings:read'), ctrl.availableTrainings);
companyRouter.get('/trainings/:trainingId', rbac('trainings:read'), ctrl.getCompanyTrainingDetail);
companyRouter.post('/trainings', rbac('trainings:assign'), ctrl.assignTraining);
companyRouter.delete('/trainings/:trainingId', rbac('trainings:assign'), ctrl.removeTraining);
companyRouter.post('/trainings/enroll', rbac('trainings:enroll', 'trainings:read'), ctrl.enrollUser);
companyRouter.patch('/trainings/enrollments/:enrollmentId', rbac('trainings:enroll', 'trainings:read'), ctrl.updateEnrollmentStatus);

export { adminRouter as trainingsAdminRouter, companyRouter as trainingsCompanyRouter };
