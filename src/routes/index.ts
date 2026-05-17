import { Router } from 'express';
import { healthCheck } from '../controllers/healthController';
import { registerController, loginController } from '../controllers/authController';
import { authenticate, authorizeAdmin } from '../middlewares/auth';
import { forgotPasswordController, resetPasswordController } from '../controllers/passwordResetController';

import { dashboardController } from '../controllers/dashboardController';
import { historyController, clearHistoryController } from '../controllers/historyController';
import { getScenariosController, checkAnswerController } from '../controllers/simulatorController';
import {
  adminStatsController,
  getUsersController,
  updateUserRoleController,
  deleteUserController,
} from '../controllers/adminController';
import {
  getProfileController,
  updateProfileController,
  changePasswordController,
  updatePreferencesController,
} from '../controllers/settingsController';
 
import { uploadAvatar } from '../middlewares/upload';
import { uploadAvatarController, handleUploadError } from '../controllers/uploadController';
import path from 'path';

import { analisar } from '../controllers/analiseController';

const router = Router();

router.get('/health', healthCheck);

router.post('/auth/register', registerController);
router.post('/auth/login', loginController);

router.post('/auth/forgot-password', forgotPasswordController);
router.post('/auth/reset-password', resetPasswordController);

router.get('/dashboard', authenticate, dashboardController);
 
router.get('/history',        authenticate, historyController);
router.delete('/history',     authenticate, clearHistoryController);
 
router.get('/simulator/scenarios',  getScenariosController);
router.post('/simulator/check',     checkAnswerController);
 
router.get('/settings/profile',          authenticate, getProfileController);
router.put('/settings/profile',          authenticate, updateProfileController);
router.put('/settings/password',         authenticate, changePasswordController);
router.put('/settings/preferences',      authenticate, updatePreferencesController);
router.post('/settings/avatar',          authenticate, uploadAvatar.single('avatar'), handleUploadError, uploadAvatarController);
 
router.get('/admin/stats',               authenticate, authorizeAdmin, adminStatsController);
router.get('/admin/users',               authenticate, authorizeAdmin, getUsersController);
router.put('/admin/users/:id/role',      authenticate, authorizeAdmin, updateUserRoleController);
router.delete('/admin/users/:id',        authenticate, authorizeAdmin, deleteUserController);

router.post('/analisar',        authenticate, analisar);
export default router;