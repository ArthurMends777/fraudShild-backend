import { prisma } from '../lib/prisma';
import { DifficultyLevel } from '@prisma/client';

const QUESTIONS_PER_SESSION = 5;
const COOLDOWN_DAYS = 4;

const mapDifficulty = (digitalLevel?: string | null): DifficultyLevel => {
  switch (digitalLevel?.toLowerCase()) {
    case 'avancado':
    case 'advanced':  return 'ADVANCED';
    case 'intermediario':
    case 'intermediate': return 'INTERMEDIATE';
    default:          return 'BEGINNER';
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
    return { session: lastSession, isNew: false };
  }

  if (lastSession?.completedAt && lastSession.expiresAt > now) {
    const diffMs = lastSession.expiresAt.getTime() - now.getTime();
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
    orderBy: { createdAt: 'asc' },
  });

  if (scenarios.length < QUESTIONS_PER_SESSION) {
    const others = await prisma.scenario.findMany({
      where: { active: true, difficulty: { not: difficulty } },
      orderBy: { createdAt: 'asc' },
      take: QUESTIONS_PER_SESSION - scenarios.length,
    });
    scenarios = [...scenarios, ...others];
  }

  if (scenarios.length === 0) {
    throw new Error('Nenhum cenário disponível');
  }

  const shuffled = scenarios.sort(() => Math.random() - 0.5).slice(0, QUESTIONS_PER_SESSION);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + COOLDOWN_DAYS);

  const session = await prisma.simulatorSession.create({
    data: {
      userId,
      expiresAt,
      total: shuffled.length,
    },
    include: { answers: true },
  });

  return { session, scenarios: shuffled, isNew: true };
};

export const getSessionScenarios = async (sessionId: string, userId: string) => {
  const session = await prisma.simulatorSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      answers: {
        include: { scenario: true },
      },
    },
  });

  if (!session) throw new Error('Sessão não encontrada');

  return session;
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

  if (!session) throw new Error('Sessão não encontrada');
  if (session.completedAt) throw new Error('Sessão já finalizada');

  const alreadyAnswered = session.answers.find(a => a.scenarioId === scenarioId);
  if (alreadyAnswered) throw new Error('Cenário já respondido');

  const scenario = await prisma.scenario.findUnique({ where: { id: scenarioId } });
  if (!scenario) throw new Error('Cenário não encontrado');

  const correct = userAnswer === scenario.isScam;

  await prisma.simulatorAnswer.create({
    data: { sessionId, scenarioId, userAnswer, correct },
  });

  const updatedAnswers = session.answers.length + 1;
  const newScore = session.score + (correct ? 1 : 0);

  if (updatedAnswers >= session.total) {
    await prisma.simulatorSession.update({
      where: { id: sessionId },
      data: { completedAt: new Date(), score: newScore },
    });

    const percentage = newScore / session.total;
    let newLevel: string | null = null;
    if (percentage >= 0.8) newLevel = 'advanced';
    else if (percentage >= 0.5) newLevel = 'intermediate';
    else newLevel = 'beginner';

    await prisma.user.update({
      where: { id: userId },
      data: { digitalLevel: newLevel },
    });
  } else {
    await prisma.simulatorSession.update({
      where: { id: sessionId },
      data: { score: newScore },
    });
  }

  return {
    correct,
    explanation: scenario.explanation,
    isScam: scenario.isScam,
    sessionCompleted: updatedAnswers >= session.total,
    score: newScore,
    total: session.total,
  };
};

export const getUserSimulatorStats = async (userId: string) => {
  const sessions = await prisma.simulatorSession.findMany({
    where: { userId, completedAt: { not: null } },
    include: { answers: true },
    orderBy: { createdAt: 'desc' },
  });

  const lastSession = await prisma.simulatorSession.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  const now = new Date();
  const nextAvailable = lastSession?.completedAt && lastSession.expiresAt > now
    ? lastSession.expiresAt
    : null;

  const totalSessions = sessions.length;
  const totalCorrect = sessions.reduce((acc, s) => acc + s.score, 0);
  const totalAnswers = sessions.reduce((acc, s) => acc + s.total, 0);

  return {
    totalSessions,
    totalCorrect,
    totalAnswers,
    accuracy: totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0,
    nextAvailable,
    lastScore: lastSession?.score ?? null,
    lastTotal: lastSession?.total ?? null,
  };
};