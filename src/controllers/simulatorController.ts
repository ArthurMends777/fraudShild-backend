import { Request, Response } from 'express';
import { getScenarios, checkAnswer } from '../services/simulatorService';
 
export const getScenariosController = (_req: Request, res: Response) => {
  return res.status(200).json(getScenarios());
};
 
export const checkAnswerController = (req: Request, res: Response) => {
  try {
    const { scenarioId, isThreat } = req.body;
    if (scenarioId === undefined || isThreat === undefined) {
      return res.status(400).json({ error: 'scenarioId e isThreat são obrigatórios' });
    }
    const result = checkAnswer(Number(scenarioId), Boolean(isThreat));
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(404).json({ error: error.message });
  }
};
 