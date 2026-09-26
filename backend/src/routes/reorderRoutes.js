import { Router } from 'express';
import {
  getReorderRules,
  createReorderRule,
  updateReorderRule,
  deleteReorderRule,
} from '../controllers/reorderController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import { USER_ROLES } from '../models/User.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getReorderRules);
router.post('/', roleMiddleware(USER_ROLES.INVENTORY_MANAGER), createReorderRule);
router.put('/:id', roleMiddleware(USER_ROLES.INVENTORY_MANAGER), updateReorderRule);
router.delete('/:id', roleMiddleware(USER_ROLES.INVENTORY_MANAGER), deleteReorderRule);

export default router;
