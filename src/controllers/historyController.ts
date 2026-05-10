import { Request, Response } from 'express';
import { getHistory, clearHistory } from '../services/historyService';
import { AnalysisType, AnalysisResult } from '@prisma/client';
 
export const historyController = async (req: Request, res: Response) => {
  try {
    const { search, type, result, page, limit } = req.query;
    const data = await getHistory({
      userId: req.user!.id,
      search:  search  as string | undefined,
      type:    type    as AnalysisType | undefined,
      result:  result  as AnalysisResult | undefined,
      page:    page    ? Number(page)  : undefined,
      limit:   limit   ? Number(limit) : undefined,
    });
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erro ao buscar histórico' });
  }
};
 
export const clearHistoryController = async (req: Request, res: Response) => {
  try {
    await clearHistory(req.user!.id);
    return res.status(200).json({ message: 'Histórico apagado com sucesso' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erro ao limpar histórico' });
  }
};
 