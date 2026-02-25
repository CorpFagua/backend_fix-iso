import { Router } from 'express';

const router = Router();

// example route
router.get('/', (req, res) => {
  res.json({ message: 'Hello from Express + TypeScript' });
});

export default router;
