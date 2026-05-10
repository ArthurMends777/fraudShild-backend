import { prisma } from '../lib/prisma';
import { comparePassword, hashPassword } from '../utils/hash';

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true,
      profileImage: true, digitalLevel: true, theme: true, role: true,
    },
  });
  if (!user) throw new Error('Usuário não encontrado');
  return user;
};

export const updateProfile = async (
  userId: string,
  data: { name?: string; profileImage?: string; digitalLevel?: string }
) => {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, email: true, profileImage: true, digitalLevel: true, theme: true },
  });
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Usuário não encontrado');

  const match = await comparePassword(currentPassword, user.password);
  if (!match) throw new Error('Senha atual incorreta');

  if (newPassword.length < 8) throw new Error('A nova senha deve ter no mínimo 8 caracteres');

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
};

export const updatePreferences = async (
  userId: string,
  data: { theme?: 'light' | 'dark' }
) => {
  const VALID_THEMES = ['light', 'dark'];
  if (data.theme && !VALID_THEMES.includes(data.theme)) {
    throw new Error('Tema inválido');
  }

  return prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, theme: true },
  });
};
