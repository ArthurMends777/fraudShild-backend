import { Request, Response } from 'express';
import { getUserDashboard } from '../services/dashboardService';
 
export const dashboardController = async (req: Request, res: Response) => {
  try {
    const data = await getUserDashboard(req.user!.id);
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erro ao carregar dashboard' });
  }
};
 