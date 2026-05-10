import { Router } from 'express';
import { healthCheck } from '../controllers/healthController';
import { registerController, loginController } from '../controllers/authController';
import { authenticate } from '../middlewares/auth';
import { forgotPasswordController, resetPasswordController } from '../controllers/passwordResetController';

const router = Router();

router.get('/health', healthCheck);

router.post('/auth/register', registerController);
router.post('/auth/login', loginController);

router.post('/auth/forgot-password', forgotPasswordController);
router.post('/auth/reset-password', resetPasswordController);

export default router;