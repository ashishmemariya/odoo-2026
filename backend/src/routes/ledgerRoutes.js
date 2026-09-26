import { Router } from 'express';
import { getLedger } from '../controllers/ledgerController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getLedger);

export default router;
