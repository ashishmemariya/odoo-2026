import { Router } from 'express';
import {
  getTransfers,
  getTransferById,
  createTransfer,
  updateTransfer,
  validateTransfer,
  cancelTransfer,
} from '../controllers/transferController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateTransfer as validateTransferMiddleware } from '../validators/transferValidator.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getTransfers);
router.get('/:id', getTransferById);
router.post('/', validateTransferMiddleware, createTransfer);
router.put('/:id', updateTransfer);
router.post('/:id/validate', validateTransfer);
router.post('/:id/cancel', cancelTransfer);

export default router;
