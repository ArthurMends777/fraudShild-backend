/**
 * Rodar com:
 *   npx ts-node src/scripts/runSeed.ts
 *   npx ts-node src/scripts/runSeed.ts --difficulty BEGINNER
 *   npx ts-node src/scripts/runSeed.ts --category phishing --count 5
 */
import { seedScenarios } from './scenarioSeeder';
import { DifficultyLevel } from '@prisma/client';

async function main() {
  const args = process.argv.slice(2);
  const getArg = (flag: string) => {
    const i = args.indexOf(flag);
    return i !== -1 ? args[i + 1] : undefined;
  };

  const difficulty  = getArg('--difficulty') as DifficultyLevel | undefined;
  const category    = getArg('--category');
  const count       = getArg('--count') ? Number(getArg('--count')) : 3;

  console.log('🤖 FraudShield — Gerador de Cenários');
  console.log('=====================================');
  if (difficulty) console.log(`Dificuldade: ${difficulty}`);
  if (category)   console.log(`Categoria:   ${category}`);
  console.log(`Cenários por combinação: ${count}`);
  console.log('=====================================\n');

  await seedScenarios({ difficulty, category, countPerCategory: count, verbose: true });
  process.exit(0);
}

main().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});