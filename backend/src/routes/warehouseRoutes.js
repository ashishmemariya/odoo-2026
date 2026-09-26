import { Router } from 'express';
import {
  getWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
} from '../controllers/warehouseController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import { USER_ROLES } from '../models/User.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getWarehouses);
router.get('/:id', getWarehouseById);

router.post('/', roleMiddleware(USER_ROLES.INVENTORY_MANAGER), createWarehouse);
router.put('/:id', roleMiddleware(USER_ROLES.INVENTORY_MANAGER), updateWarehouse);
router.delete('/:id', roleMiddleware(USER_ROLES.INVENTORY_MANAGER), deleteWarehouse);

export default router;
