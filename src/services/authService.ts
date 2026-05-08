import { prisma } from '../lib/prisma';
import { hashPassword, comparePassword } from '../utils/hash';
import jwt from 'jsonwebtoken';

export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
  profileImage?: string;
  digitalLevel?: string;
  theme?: string;
}) => {
    const userExists = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (userExists) {
        throw new Error('User already exists');
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: hashedPassword,
            profileImage: data.profileImage,
            digitalLevel: data.digitalLevel,
            theme: data.theme ?? 'light',
        },
    });

    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
};

export const loginUser = async (data: {
  email: string;
  password: string;
}) => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new Error('Invalid credentials');
  }

  const passwordMatch = await comparePassword(data.password, user.password);

  if (!passwordMatch) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );

  const { password, ...userWithoutPassword } = user;
  return { user: userWithoutPassword, token };
};