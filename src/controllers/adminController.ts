import { Request, Response } from 'express';
import { getAdminStats, getUsers, updateUserRole, deleteUser } from '../services/adminService';
 
export const adminStatsController = async (_req: Request, res: Response) => {
  try {
    return res.status(200).json(await getAdminStats());
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erro ao carregar painel admin' });
  }
};
 
export const getUsersController = async (req: Request, res: Response) => {
  try {
    const { search, role, page, limit } = req.query;
    const data = await getUsers({
      search: search as string | undefined,
      role:   role   as string | undefined,
      page:   page   ? Number(page)  : undefined,
      limit:  limit  ? Number(limit) : undefined,
    });
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erro ao buscar usuários' });
  }
};
 
export const updateUserRoleController = async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: 'role é obrigatório' });
    const user = await updateUserRole(req.params.id as string, role as string);
    return res.status(200).json(user);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};
 
export const deleteUserController = async (req: Request, res: Response) => {
  try {
    await deleteUser(req.params.id as string);
    return res.status(200).json({ message: 'Usuário removido com sucesso' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
 