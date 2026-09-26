import { Router } from 'express';
import { getUsers, getUserById, updateUserRole } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import { USER_ROLES } from '../models/User.js';

const router = Router();

router.use(authMiddleware);

// Only inventory managers can manage users
router.get('/', roleMiddleware(USER_ROLES.INVENTORY_MANAGER), getUsers);
router.get('/:id', roleMiddleware(USER_ROLES.INVENTORY_MANAGER), getUserById);
router.put('/:id/role', roleMiddleware(USER_ROLES.INVENTORY_MANAGER), updateUserRole);

export default router;
