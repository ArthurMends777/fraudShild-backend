import { Request, Response } from 'express';
import { updateProfile } from '../services/settingsService';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

export const uploadAvatarController = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const { prisma } = await import('../lib/prisma');
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { profileImage: true },
    });

    if (currentUser?.profileImage) {
      const oldPath = path.resolve(currentUser.profileImage.replace(/^\//, ''));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const user = await updateProfile(req.user!.id, { profileImage: avatarUrl });
    return res.status(200).json({ profileImage: user.profileImage });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erro ao fazer upload' });
  }
};

export const handleUploadError = (err: any, req: Request, res: Response, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Arquivo muito grande. Máximo permitido: 5MB.' });
    }
    return res.status(400).json({ error: `Erro no upload: ${err.message}` });
  }
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};