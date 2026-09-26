import { Router } from 'express';
import {
  signup,
  login,
  getMe,
  forgotPassword,
  verifyOtp,
  resetPassword,
} from '../controllers/authController.js';
import { updateProfile, changePassword } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter.js';
import { validateSignup, validateLogin } from '../validators/authValidator.js';

const router = Router();

// Public routes
router.post('/signup', authLimiter, validateSignup, signup);
router.post('/login', authLimiter, validateLogin, login);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/verify-otp', otpLimiter, verifyOtp);
router.post('/reset-password', otpLimiter, resetPassword);

// Protected routes
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, updateProfile);
router.put('/change-password', authMiddleware, changePassword);

export default router;
