import { Router } from 'express';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import { USER_ROLES } from '../models/User.js';

const router = Router();

router.use(authMiddleware);

// All authenticated users can view categories
router.get('/', getCategories);
router.get('/:id', getCategoryById);

// Only inventory managers can create/modify categories
router.post('/', roleMiddleware(USER_ROLES.INVENTORY_MANAGER), createCategory);
router.put('/:id', roleMiddleware(USER_ROLES.INVENTORY_MANAGER), updateCategory);
router.delete('/:id', roleMiddleware(USER_ROLES.INVENTORY_MANAGER), deleteCategory);

export default router;
