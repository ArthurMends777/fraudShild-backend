import { prisma } from '../lib/prisma';
import { AnalysisResult, AnalysisType } from '@prisma/client';

interface HistoryFilters {
  userId: string;
  search?:  string;
  type?:    AnalysisType;
  result?:  AnalysisResult;
  page?:    number;
  limit?:   number;
}

export const getHistory = async ({
  userId,
  search,
  type,
  result,
  page  = 1,
  limit = 10,
}: HistoryFilters) => {
  const where = {
    userId,
    ...(type   && { type }),
    ...(result && { result }),
    ...(search && {
      content: { contains: search, mode: 'insensitive' as const },
    }),
  };

  const [items, total] = await Promise.all([
    prisma.analysis.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:  (page - 1) * limit,
      take:  limit,
      select: {
        id: true, type: true, content: true, result: true,
        confidence: true, createdAt: true, sourceUrl: true,
      },
    }),
    prisma.analysis.count({ where }),
  ]);

  const all = await prisma.analysis.findMany({
    where: { userId },
    select: { result: true },
  });

  const summary = {
    total:      all.length,
    confiaveis: all.filter((a) => a.result === 'TRUE').length,
    suspeitos:  all.filter((a) => a.result === 'SUSPECT').length,
    altoRisco:  all.filter((a) => a.result === 'FALSE').length,
  };

  return { items, summary, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
};

export const clearHistory = async (userId: string) => {
  await prisma.analysis.deleteMany({ where: { userId } });
};
