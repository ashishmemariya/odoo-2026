import { Router } from 'express';
import {
  getAdjustments,
  getAdjustmentById,
  createAdjustment,
  updateAdjustment,
  validateAdjustment,
  cancelAdjustment,
} from '../controllers/adjustmentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateAdjustment as validateAdjustmentMiddleware } from '../validators/adjustmentValidator.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getAdjustments);
router.get('/:id', getAdjustmentById);
router.post('/', validateAdjustmentMiddleware, createAdjustment);
router.put('/:id', updateAdjustment);
router.post('/:id/validate', validateAdjustment);
router.post('/:id/cancel', cancelAdjustment);

export default router;
