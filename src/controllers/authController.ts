import { Request, Response } from 'express';
import { registerUser } from '../services/authService';

export const registerController = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    const user = await registerUser({ name, email, password });

    return res.status(201).json(user);
  } catch (error: any) {
    return res.status(400).json({
      error: error.message || 'Error creating user',
    });
  }
};