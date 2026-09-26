import { Router } from 'express';
import {
  getLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
} from '../controllers/locationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import { USER_ROLES } from '../models/User.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getLocations);
router.get('/:id', getLocationById);

router.post('/', roleMiddleware(USER_ROLES.INVENTORY_MANAGER), createLocation);
router.put('/:id', roleMiddleware(USER_ROLES.INVENTORY_MANAGER), updateLocation);
router.delete('/:id', roleMiddleware(USER_ROLES.INVENTORY_MANAGER), deleteLocation);

export default router;
