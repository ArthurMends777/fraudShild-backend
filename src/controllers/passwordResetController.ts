import { Request, Response } from 'express';
import { requestPasswordReset, resetPassword } from '../services/passwordResetService';


export const forgotPasswordController = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'E-mail é obrigatório' });
    }

    await requestPasswordReset(email);

    return res.status(200).json({
      message: 'Se este e-mail estiver cadastrado, você receberá as instruções em breve.',
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Erro ao processar solicitação' });
  }
};


export const resetPasswordController = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'A senha deve ter no mínimo 8 caracteres' });
    }

    await resetPassword(token, newPassword);

    return res.status(200).json({ message: 'Senha redefinida com sucesso' });
  } catch (error: any) {
    return res.status(400).json({
      error: error.message || 'Erro ao redefinir senha',
    });
  }
};
