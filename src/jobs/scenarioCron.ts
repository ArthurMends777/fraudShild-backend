import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { seedScenarios } from '../scripts/scenarioSeeder';
import { DifficultyLevel } from '@prisma/client';

const MIN_SCENARIOS_PER_LEVEL = 15; // mínimo por nível de dificuldade

async function checkAndRefill() {
  console.log('[Cron] Verificando estoque de cenários...');

  const difficulties: DifficultyLevel[] = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

  for (const difficulty of difficulties) {
    const count = await prisma.scenario.count({
      where: { difficulty, active: true },
    });

    if (count < MIN_SCENARIOS_PER_LEVEL) {
      const needed = MIN_SCENARIOS_PER_LEVEL - count;
      console.log(`[Cron] ${difficulty}: ${count} cenários — gerando mais ${needed}...`);

      await seedScenarios({
        difficulty,
        countPerCategory: Math.ceil(needed / 8), // 8 categorias
        verbose: false,
      });

      console.log(`[Cron] ${difficulty}: reabastecido ✅`);
    } else {
      console.log(`[Cron] ${difficulty}: ${count} cenários — OK`);
    }
  }
}

export function startScenarioCron() {
  // Roda toda segunda-feira às 3h da manhã
  cron.schedule('0 3 * * 1', async () => {
    console.log('[Cron] Iniciando geração automática de cenários...');
    try {
      await checkAndRefill();
    } catch (err: any) {
      console.error('[Cron] Erro na geração automática:', err.message);
    }
  });

  console.log('⏰ Cron de cenários agendado (toda segunda às 3h)');

  // Verifica imediatamente na inicialização se o banco está vazio
  prisma.scenario.count().then(total => {
    if (total === 0) {
      console.log('[Cron] Banco vazio — rodando seed inicial...');
      seedScenarios({ countPerCategory: 3, verbose: true }).catch(console.error);
    }
  });
}