import { prisma } from '../lib/prisma';
import { DifficultyLevel } from '@prisma/client';

const QUESTIONS_PER_SESSION = 5;
const COOLDOWN_DAYS = 4;

const mapDifficulty = (digitalLevel?: string | null): DifficultyLevel => {
  switch (digitalLevel?.toLowerCase()) {
    case 'avancado':
    case 'advanced':     return 'ADVANCED';
    case 'intermediario':
    case 'intermediate': return 'INTERMEDIATE';
    default:             return 'BEGINNER';
  }
};

export const getOrCreateSession = async (userId: string) => {
  const lastSession = await prisma.simulatorSession.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { answers: true },
  });

  const now = new Date();

  if (lastSession && !lastSession.completedAt) {
    const answeredIds = lastSession.answers.map(a => a.scenarioId)

    // Fallback: se scenarioIds está vazio, recria com novos cenários
    if (!lastSession.scenarioIds || lastSession.scenarioIds.length === 0) {
      await prisma.simulatorSession.delete({ where: { id: lastSession.id } })
    } else {
      const scenarios = await prisma.scenario.findMany({
        where: { id: { in: lastSession.scenarioIds } },
      })

      const ordered = lastSession.scenarioIds
        .map(id => scenarios.find(s => s.id === id))
        .filter(Boolean) as typeof scenarios

      return {
        session:     lastSession,
        scenarios:   ordered,
        answeredIds,
        isNew:       false,
      }
    }
  }

  if (lastSession?.completedAt && lastSession.expiresAt > now) {
    const diffMs   = lastSession.expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    throw new Error(`COOLDOWN:${diffDays}`);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { digitalLevel: true },
  });

  const difficulty = mapDifficulty(user?.digitalLevel);

  let scenarios = await prisma.scenario.findMany({
    where: { active: true, difficulty },
  });

  if (scenarios.length < QUESTIONS_PER_SESSION) {
    const others = await prisma.scenario.findMany({
      where: { active: true, difficulty: { not: difficulty } },
      take: QUESTIONS_PER_SESSION - scenarios.length,
    });
    scenarios = [...scenarios, ...others];
  }

  if (scenarios.length === 0) throw new Error('Nenhum cenário disponível');

  const shuffled    = scenarios.sort(() => Math.random() - 0.5).slice(0, QUESTIONS_PER_SESSION);
  const scenarioIds = shuffled.map(s => s.id);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + COOLDOWN_DAYS);

  const session = await prisma.simulatorSession.create({
    data: {
      userId,
      scenarioIds,
      expiresAt,
      total: shuffled.length,
    },
    include: { answers: true },
  });

  return { session, scenarios: shuffled, answeredIds: [] as string[], isNew: true };
};

export const submitAnswer = async (
  sessionId: string,
  userId: string,
  scenarioId: string,
  userAnswer: boolean
) => {
  const session = await prisma.simulatorSession.findFirst({
    where: { id: sessionId, userId },
    include: { answers: true },
  });

  if (!session)            throw new Error('Sessão não encontrada');
  if (session.completedAt) throw new Error('Sessão já finalizada');

  if (session.answers.find(a => a.scenarioId === scenarioId)) {
    throw new Error('Cenário já respondido');
  }

  const scenario = await prisma.scenario.findUnique({ where: { id: scenarioId } });
  if (!scenario) throw new Error('Cenário não encontrado');

  const correct     = userAnswer === scenario.isScam;
  const newScore    = session.score + (correct ? 1 : 0);
  const totalAnswered = session.answers.length + 1;

  await prisma.simulatorAnswer.create({
    data: { sessionId, scenarioId, userAnswer, correct },
  });

  if (totalAnswered >= session.total) {
    await prisma.simulatorSession.update({
      where: { id: sessionId },
      data:  { completedAt: new Date(), score: newScore },
    });

    const pct = newScore / session.total;
    const newLevel = pct >= 0.8 ? 'advanced' : pct >= 0.5 ? 'intermediate' : 'beginner';
    await prisma.user.update({ where: { id: userId }, data: { digitalLevel: newLevel } });
  } else {
    await prisma.simulatorSession.update({
      where: { id: sessionId },
      data:  { score: newScore },
    });
  }

  return {
    correct,
    explanation:      scenario.explanation,
    isScam:           scenario.isScam,
    sessionCompleted: totalAnswered >= session.total,
    score:            newScore,
    total:            session.total,
  };
};

export const getUserSimulatorStats = async (userId: string) => {
  const [sessions, lastSession] = await Promise.all([
    prisma.simulatorSession.findMany({
      where:   { userId, completedAt: { not: null } },
      include: { answers: true },
    }),
    prisma.simulatorSession.findFirst({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const now          = new Date();
  const nextAvailable = lastSession?.completedAt && lastSession.expiresAt > now
    ? lastSession.expiresAt : null;

  const totalCorrect = sessions.reduce((acc, s) => acc + s.score, 0);
  const totalAnswers = sessions.reduce((acc, s) => acc + s.total, 0);

  return {
    totalSessions: sessions.length,
    totalCorrect,
    totalAnswers,
    accuracy:      totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0,
    nextAvailable,
    lastScore:     lastSession?.score ?? null,
    lastTotal:     lastSession?.total ?? null,
  };
};