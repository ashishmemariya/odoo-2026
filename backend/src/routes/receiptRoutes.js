import { Router } from 'express';
import {
  getReceipts,
  getReceiptById,
  createReceipt,
  updateReceipt,
  updateReceiptStatus,
  validateReceipt,
  cancelReceipt,
} from '../controllers/receiptController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateReceipt as validateReceiptMiddleware } from '../validators/receiptValidator.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getReceipts);
router.get('/:id', getReceiptById);
router.post('/', validateReceiptMiddleware, createReceipt);
router.put('/:id', updateReceipt);
router.put('/:id/status', updateReceiptStatus);
router.post('/:id/validate', validateReceipt);
router.post('/:id/cancel', cancelReceipt);

export default router;
