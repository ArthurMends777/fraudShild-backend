import { prisma } from '../lib/prisma';

export const getAdminStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    analysesToday,
    scamsDetected,
    totalAnalyses,
    byType,
    userStatus,
    recentActivity,
  ] = await Promise.all([
    prisma.user.count(),

    prisma.analysis.count({ where: { createdAt: { gte: today } } }),

    prisma.analysis.count({ where: { result: 'FALSE' } }),

    prisma.analysis.count(),

    prisma.analysis.groupBy({ by: ['type'], _count: { id: true } }),

    prisma.user.groupBy({ by: ['role'], _count: { id: true } }),

    prisma.analysis.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        type: true,
        result: true,
        createdAt: true,
        user: { select: { name: true } },
      },
    }),
  ]);

  const detectionRate =
    totalAnalyses > 0
      ? ((scamsDetected / totalAnalyses) * 100).toFixed(1)
      : '0.0';

  return {
    stats: {
      totalUsers,
      analysesToday,
      scamsDetected,
      detectionRate: `${detectionRate}%`,
    },
    byType,
    userStatus,
    recentActivity,
  };
};

export const getUsers = async ({
  search,
  role,
  page  = 1,
  limit = 10,
}: {
  search?: string;
  role?:   string;
  page?:   number;
  limit?:  number;
}) => {
  const where = {
    ...(role && { role }),
    ...(search && {
      OR: [
        { name:  { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:  (page - 1) * limit,
      take:  limit,
      select: {
        id: true, name: true, email: true, role: true,
        profileImage: true, createdAt: true,
        _count: { select: { analyses: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { users, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
};


export const updateUserRole = async (userId: string, role: string) => {
  const VALID_ROLES = ['user', 'admin', 'moderador'];
  if (!VALID_ROLES.includes(role)) throw new Error('Role inválida');

  return prisma.user.update({
    where: { id: userId },
    data:  { role },
    select: { id: true, name: true, email: true, role: true },
  });
};

export const deleteUser = async (userId: string) => {
  await prisma.user.delete({ where: { id: userId } });
};
