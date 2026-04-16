import { prisma } from '../lib/prisma';
import { hashPassword } from '../utils/hash';

export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
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
        },
    });

    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
};