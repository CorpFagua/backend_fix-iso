import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import { rbac } from '../../middleware/rbac';
import multer from 'multer';
import * as ctrl from './documents.controller';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

const router = Router();

router.use(authMiddleware);

router.get('/', rbac('documents:read'), ctrl.list);
router.get('/templates', rbac('documents:read'), ctrl.templates);
router.get('/:id', rbac('documents:read'), ctrl.getById);
router.post('/', rbac('documents:create'), ctrl.create);
router.post('/upload', rbac('documents:create'), upload.single('file'), ctrl.upload);
router.put('/:id', rbac('documents:edit'), ctrl.update);
router.delete('/:id', rbac('documents:delete'), ctrl.remove);
router.post('/init-company-folders/:companyId', rbac('documents:create'), ctrl.initFolders);

export default router;
