import { Request, Response } from 'express';
import { getOrCreateSession, submitAnswer, getUserSimulatorStats } from '../services/simulatorService';
import { prisma } from '../lib/prisma';
import { seedScenarios } from '../scripts/scenarioSeeder';
import { DifficultyLevel } from '@prisma/client';

export const startSessionController = async (req: Request, res: Response) => {
  try {
    const { session, scenarios, answeredIds } = await getOrCreateSession(req.user!.id);

    return res.json({
      sessionId:    session.id,
      score:        session.score,
      total:        session.total,
      completedAt:  session.completedAt,
      answeredCount: answeredIds.length,
      scenarios: scenarios.map(s => ({
        id:         s.id,
        title:      s.title,
        content:    s.content,
        category:   s.category,
        difficulty: s.difficulty,
        answered:   answeredIds.includes(s.id),
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
    return res.json(await getUserSimulatorStats(req.user!.id));
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
      data: {
        title:       title || '',
        content,
        category:    category || 'geral',
        isScam,
        explanation,
        difficulty:  difficulty || 'BEGINNER',
      },
    });
    return res.status(201).json(scenario);
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
};

export const seedScenariosController = async (req: Request, res: Response) => {
  try {
    const { difficulty, category, count = 3 } = req.body;
    const result = await seedScenarios({
      difficulty: difficulty as DifficultyLevel | undefined,
      category,
      countPerCategory: Number(count),
      verbose: false,
    });
    return res.json({ message: 'Seed concluído', ...result });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};