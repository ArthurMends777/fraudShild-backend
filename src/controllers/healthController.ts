import { Request, Response } from 'express';

export const healthCheck = (req: Request, res: Response) => {
  return res.json({
    status: 'ok',
    message: 'FraudShield API running'
  });
};