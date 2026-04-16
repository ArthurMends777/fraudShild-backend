import { Router } from 'express';
import { healthCheck } from '../controllers/healthController';
import { registerController } from '../controllers/authController';

const router = Router();

router.get('/health', healthCheck);
router.post('/auth/register', registerController);

export default router;