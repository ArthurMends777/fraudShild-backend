import { Request, Response } from 'express';
import {
  getOrCreateSession,
  getSessionScenarios,
  submitAnswer,
  getUserSimulatorStats,
} from '../services/simulatorService';
import { prisma } from '../lib/prisma';

export const startSessionController = async (req: Request, res: Response) => {
  try {
    const { session, scenarios, isNew } = await getOrCreateSession(req.user!.id);

    let scenariosToSend = scenarios;
    if (!isNew) {
      const fullSession = await getSessionScenarios(session.id, req.user!.id);
      const answeredIds = fullSession.answers.map(a => a.scenarioId);

      scenariosToSend = await prisma.scenario.findMany({
        where: { id: { in: answeredIds } },
      }) as any;
    }

    return res.json({
      sessionId: session.id,
      score: session.score,
      total: session.total,
      completedAt: session.completedAt,
      answeredCount: session.answers?.length ?? 0,
      scenarios: (scenariosToSend ?? []).map((s: any) => ({
        id: s.id,
        title: s.title,
        content: s.content,
        category: s.category,
        difficulty: s.difficulty,
      })),
    });
  } catch (error: any) {
    if (error.message?.startsWith('COOLDOWN:')) {
      const days = error.message.split(':')[1];
      return res.status(429).json({ error: 'COOLDOWN', daysRemaining: Number(days) });
    }
    return res.status(500).json({ error: error.message });
  }
};

export const answerController = async (req: Request, res: Response) => {
  try {
    const { sessionId, scenarioId, answer } = req.body;
    if (!sessionId || !scenarioId || answer === undefined) {
      return res.status(400).json({ error: 'sessionId, scenarioId e answer são obrigatórios' });
    }

    const result = await submitAnswer(sessionId, req.user!.id, scenarioId, Boolean(answer));
    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const statsController = async (req: Request, res: Response) => {
  try {
    const stats = await getUserSimulatorStats(req.user!.id);
    return res.json(stats);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const listScenariosController = async (req: Request, res: Response) => {
  try {
    const scenarios = await prisma.scenario.findMany({ orderBy: { createdAt: 'desc' } });
    return res.json(scenarios);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createScenarioController = async (req: Request, res: Response) => {
  try {
    const { title, content, category, isScam, explanation, difficulty } = req.body;
    if (!content || isScam === undefined || !explanation) {
      return res.status(400).json({ error: 'content, isScam e explanation são obrigatórios' });
    }
    const scenario = await prisma.scenario.create({
      data: { title: title || '', content, category: category || 'geral', isScam, explanation, difficulty: difficulty || 'BEGINNER' },
    });
    return res.status(201).json(scenario);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};