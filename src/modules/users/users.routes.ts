import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth';
import * as ctrl from './users.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', ctrl.listUsers);
router.get('/:id', ctrl.getUser);
router.post('/', ctrl.createUser);
router.put('/:id', ctrl.updateUser);
router.delete('/:id', ctrl.deleteUser);

export default router;
