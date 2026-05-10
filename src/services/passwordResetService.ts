import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { hashPassword } from '../utils/hash';
import { sendPasswordResetEmail } from '../utils/mailer';

const RESET_TOKEN_EXPIRES_IN_MS = 1000 * 60 * 60; 

export const requestPasswordReset = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) return;

  const rawToken = crypto.randomBytes(32).toString('hex');

  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  await prisma.user.update({
    where: { email },
    data: {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: new Date(Date.now() + RESET_TOKEN_EXPIRES_IN_MS),
    },
  });

  await sendPasswordResetEmail(user.email, user.name, rawToken);
};


export const resetPassword = async (rawToken: string, newPassword: string) => {
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { gt: new Date() }, 
    },
  });

  if (!user) {
    throw new Error('Token inválido ou expirado');
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });
};
