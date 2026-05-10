import { Request, Response } from 'express';
import { getProfile, updateProfile, changePassword, updatePreferences } from '../services/settingsService';
 
export const getProfileController = async (req: Request, res: Response) => {
  try {
    return res.status(200).json(await getProfile(req.user!.id));
  } catch (error: any) {
    return res.status(404).json({ error: error.message });
  }
};
 
export const updateProfileController = async (req: Request, res: Response) => {
  try {
    const { name, profileImage, digitalLevel } = req.body;
    const user = await updateProfile(req.user!.id, { name, profileImage, digitalLevel });
    return res.status(200).json(user);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};
 
export const changePasswordController = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
    }
    await changePassword(req.user!.id, currentPassword, newPassword);
    return res.status(200).json({ message: 'Senha alterada com sucesso' });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};
 
export const updatePreferencesController = async (req: Request, res: Response) => {
  try {
    const { theme } = req.body;
    const user = await updatePreferences(req.user!.id, { theme });
    return res.status(200).json(user);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};