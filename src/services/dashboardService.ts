import { prisma } from '../lib/prisma';

export const getUserDashboard = async (userId: string) => {
  const [analyses, recentAnalyses] = await Promise.all([
    prisma.analysis.findMany({ where: { userId } }),
    prisma.analysis.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        type: true,
        content: true,
        result: true,
        confidence: true,
        createdAt: true,
      },
    }),
  ]);

  const total = analyses.length;
  const confiaveis = analyses.filter((a) => a.result === 'TRUE').length;
  const suspeitos  = analyses.filter((a) => a.result === 'SUSPECT').length;
  const altoRisco  = analyses.filter((a) => a.result === 'FALSE').length;

  const byType = analyses.reduce<Record<string, number>>((acc, a) => {
    acc[a.type] = (acc[a.type] ?? 0) + 1;
    return acc;
  }, {});

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const byMonth = analyses
    .filter((a) => a.createdAt >= sixMonthsAgo)
    .reduce<Record<string, number>>((acc, a) => {
      const key = a.createdAt.toISOString().slice(0, 7); 
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

  return {
    stats: { total, confiaveis, suspeitos, altoRisco },
    byType,
    byMonth,
    recentAnalyses,
  };
};
