import { Router } from 'express';
import {
  getDeliveries,
  getDeliveryById,
  createDelivery,
  updateDelivery,
  updateDeliveryStatus,
  confirmDelivery,
  pickDelivery,
  packDelivery,
  validateDelivery,
  cancelDelivery,
} from '../controllers/deliveryController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateDelivery as validateDeliveryMiddleware } from '../validators/deliveryValidator.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getDeliveries);
router.get('/:id', getDeliveryById);
router.post('/', validateDeliveryMiddleware, createDelivery);
router.put('/:id', updateDelivery);
router.put('/:id/status', updateDeliveryStatus);
router.post('/:id/confirm', confirmDelivery);
router.post('/:id/pick', pickDelivery);
router.post('/:id/pack', packDelivery);
router.post('/:id/validate', validateDelivery);
router.post('/:id/cancel', cancelDelivery);

export default router;
