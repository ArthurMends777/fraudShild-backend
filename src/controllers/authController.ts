import { Request, Response } from 'express';
import { loginUser, registerUser } from '../services/authService';

const VALID_THEMES = ['light', 'dark'];

export const registerController = async (req: Request, res: Response) => {
  try {
    const { name, email, password, profileImage, digitalLevel, theme } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (theme && !VALID_THEMES.includes(theme)) {
      return res.status(400).json({ error: 'Invalid theme. Use "light" or "dark"' });
    }

    const user = await registerUser({
      name,
      email,
      password,
      profileImage,
      digitalLevel,
      theme,
    });

    return res.status(201).json(user);
  } catch (error: any) {
    return res.status(400).json({
      error: error.message || 'Error creating user',
    });
  }
};

export const loginController = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await loginUser({ email, password });

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(401).json({
      error: error.message || 'Error logging in',
    });
  }
};