import { Router } from 'express';
import userRoutes from './userRoutes';

const router = Router();

router.use('/users', userRoutes);

// Ruta de health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Service is running' });
});

export default router;
