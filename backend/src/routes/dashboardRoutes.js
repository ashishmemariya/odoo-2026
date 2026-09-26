import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboardController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

// Supports both /api/dashboard and /api/dashboard/summary
router.get('/', getDashboardSummary);
router.get('/summary', getDashboardSummary);

export default router;
