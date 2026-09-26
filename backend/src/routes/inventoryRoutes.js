import { Router } from 'express';
import {
  getInventory,
  getProductInventory,
  getLocationInventory,
  getWarehouseInventory,
} from '../controllers/inventoryController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getInventory);
router.get('/product/:productId', getProductInventory);
router.get('/location/:locationId', getLocationInventory);
router.get('/warehouse/:warehouseId', getWarehouseInventory);

export default router;
