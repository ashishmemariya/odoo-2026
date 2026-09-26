import { Router } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';
import { getCategories } from '../controllers/categoryController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { roleMiddleware } from '../middleware/roleMiddleware.js';
import { USER_ROLES } from '../models/User.js';
import { validateProduct } from '../validators/productValidator.js';

const router = Router();

router.use(authMiddleware);

// Aliased endpoint for frontend compatibility: GET /api/products/categories
router.get('/categories', getCategories);

// All authenticated users can browse products
router.get('/', getProducts);
router.get('/:id', getProductById);

// Inventory managers can create, edit, or delete products
router.post('/', roleMiddleware(USER_ROLES.INVENTORY_MANAGER), validateProduct, createProduct);
router.put('/:id', roleMiddleware(USER_ROLES.INVENTORY_MANAGER), updateProduct);
router.delete('/:id', roleMiddleware(USER_ROLES.INVENTORY_MANAGER), deleteProduct);

export default router;
