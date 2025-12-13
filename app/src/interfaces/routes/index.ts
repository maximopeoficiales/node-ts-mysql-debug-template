import { Router } from 'express';
import userRoutes from './userRoutes';
import { metricsCollector } from '../../infrastructure/metrics/MetricsCollector';

const router = Router();

router.use('/users', userRoutes);

// Ruta de health check
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Service is running' });
});

// Endpoint de métricas para Prometheus
router.get('/metrics', async (req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(await metricsCollector.getMetrics());
});

export default router;
