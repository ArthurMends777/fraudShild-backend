import Groq from 'groq-sdk';
import { prisma } from '../lib/prisma';
import { DifficultyLevel } from '@prisma/client';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const CATEGORIES = [
  'phishing', 'fake_news', 'golpe_pix', 'engenharia_social',
  'malware', 'golpe_whatsapp', 'desinformacao_saude', 'golpe_emprego',
];

const DIFFICULTY_CONFIG: Record<DifficultyLevel, { label: string; instruction: string }> = {
  BEGINNER: {
    label: 'iniciante',
    instruction: 'O cenário deve ser óbvio, com sinais claros de golpe como erros de português, URLs suspeitas evidentes, urgência exagerada ou promessas absurdas.',
  },
  INTERMEDIATE: {
    label: 'intermediário',
    instruction: 'O cenário deve ser moderadamente convincente, com alguns sinais sutis de golpe misturados com elementos reais. Não deve ser óbvio à primeira vista.',
  },
  ADVANCED: {
    label: 'avançado',
    instruction: 'O cenário deve ser muito convincente, sofisticado, com linguagem profissional e sinais de golpe muito sutis. Pode incluir técnicas avançadas como spoofing, deepfake textual ou engenharia social elaborada.',
  },
};

interface GeneratedScenario {
  title: string;
  content: string;
  category: string;
  isScam: boolean;
  explanation: string;
  difficulty: DifficultyLevel;
}

async function generateScenarios(
  category: string,
  difficulty: DifficultyLevel,
  count: number = 3
): Promise<GeneratedScenario[]> {
  const config = DIFFICULTY_CONFIG[difficulty];

  const prompt = `Você é um especialista em segurança digital brasileiro. Gere ${count} cenários realistas para um simulador educativo sobre golpes digitais e fake news.

Categoria: ${category}
Nível de dificuldade: ${config.label}
Instrução de dificuldade: ${config.instruction}

Gere uma mistura de cenários: alguns sendo golpes reais (isScam: true) e outros sendo conteúdo legítimo (isScam: false).

Responda APENAS com um JSON válido no seguinte formato (sem markdown, sem texto extra):
[
  {
    "title": "título curto do cenário",
    "content": "mensagem ou conteúdo completo que o usuário veria (texto realista, como uma mensagem de WhatsApp, e-mail, post de rede social, notícia, etc). Máximo 300 caracteres.",
    "isScam": true,
    "explanation": "explicação clara de por que é golpe/fake news OU por que é legítimo. Mencione os sinais específicos. Máximo 200 caracteres."
  }
]

Regras importantes:
- O conteúdo deve ser em português brasileiro
- Deve parecer uma mensagem/notícia real que alguém receberia
- A explicação deve ser educativa e mencionar os sinais específicos
- Para isScam: false, crie conteúdo genuinamente legítimo (notícia real, comunicado oficial, etc)
- Varie entre mensagens de WhatsApp, e-mails, posts, notícias, SMS
- NÃO use nomes de pessoas reais identificáveis`;

  const message = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 2000,
    temperature: 0.8,
    messages: [
      {
        role: 'system',
        content: 'Você é um especialista em segurança digital brasileiro. Responda APENAS com JSON válido, sem markdown, sem texto extra.',
      },
      { role: 'user', content: prompt },
    ],
  });

  const text = message.choices[0].message.content ?? '';
  // Extrai JSON mesmo se vier com algum texto ao redor
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error(`JSON não encontrado na resposta: ${text.substring(0, 200)}`);
  const parsed: Omit<GeneratedScenario, 'difficulty' | 'category'>[] = JSON.parse(jsonMatch[0]);

  return parsed.map(s => ({ ...s, category, difficulty }));
}

async function scenarioExists(content: string): Promise<boolean> {
  // Verifica se já existe cenário muito similar (primeiros 100 chars)
  const existing = await prisma.scenario.findFirst({
    where: { content: { startsWith: content.substring(0, 80) } },
  });
  return !!existing;
}

export async function seedScenarios(options: {
  difficulty?: DifficultyLevel;
  category?: string;
  countPerCategory?: number;
  verbose?: boolean;
} = {}) {
  const {
    difficulty,
    category,
    countPerCategory = 3,
    verbose = true,
  } = options;

  const difficulties: DifficultyLevel[] = difficulty
    ? [difficulty]
    : ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

  const categories = category ? [category] : CATEGORIES;

  let totalCreated = 0;
  let totalSkipped = 0;

  for (const diff of difficulties) {
    for (const cat of categories) {
      if (verbose) console.log(`\n⏳ Gerando: ${cat} / ${diff}...`);

      try {
        const scenarios = await generateScenarios(cat, diff, countPerCategory);

        for (const scenario of scenarios) {
          const exists = await scenarioExists(scenario.content);
          if (exists) {
            if (verbose) console.log(`  ⏭️  Pulando duplicata: ${scenario.title}`);
            totalSkipped++;
            continue;
          }

          await prisma.scenario.create({
            data: {
              title:       scenario.title,
              content:     scenario.content,
              category:    scenario.category,
              isScam:      scenario.isScam,
              explanation: scenario.explanation,
              difficulty:  scenario.difficulty,
              active:      true,
            },
          });

          if (verbose) console.log(`  ✅ Criado: ${scenario.title} (isScam: ${scenario.isScam})`);
          totalCreated++;
        }

        // Pequena pausa para não sobrecarregar a API
        await new Promise(r => setTimeout(r, 1000));

      } catch (err: any) {
        console.error(`  ❌ Erro em ${cat}/${diff}:`, err.message);
      }
    }
  }

  if (verbose) {
    console.log(`\n✅ Seed concluído: ${totalCreated} criados, ${totalSkipped} pulados`);
  }

  return { totalCreated, totalSkipped };
}