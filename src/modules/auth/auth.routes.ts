import { Router } from 'express';
import { authLimiter } from '../../middleware/rateLimiter';
import { authMiddleware } from '../../middleware/auth';
import { loginHandler, refreshHandler, logoutHandler, meHandler } from './auth.controller';

const router = Router();

router.post('/login', authLimiter, loginHandler);
router.post('/refresh', refreshHandler);
router.post('/logout', authMiddleware, logoutHandler);
router.get('/me', authMiddleware, meHandler);

export default router;
