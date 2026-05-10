// por ora são estáticos

export interface Scenario {
  id:          number;
  category:    string;
  content:     string;
  isThreat:    boolean;
  explanation: string;
  tips:        string[];
}

export const SCENARIOS: Scenario[] = [
  {
    id: 1,
    category: 'PHISHING',
    content:
      'Prezado cliente, detectamos uma atividade suspeita em sua conta. Para evitar o bloqueio, atualize seus dados clicando no link: http://banco-seguro.xyz/atualizar. Você tem 24 horas para resolver.',
    isThreat: true,
    explanation:
      'Este é um golpe de phishing clássico: usa urgência ("24 horas"), domínio falso ("banco-seguro.xyz") e pede dados pessoais.',
    tips: [
      'Bancos nunca pedem atualização de dados por link em mensagem.',
      'Verifique sempre o domínio oficial da instituição.',
      'Desconfie de mensagens com tom de urgência.',
    ],
  },
  {
    id: 2,
    category: 'FAKE NEWS',
    content:
      'URGENTE: Novo vírus transmitido por 5G está matando pessoas! Compartilhe antes que censurem!',
    isThreat: true,
    explanation:
      'Fake news com marcadores clássicos: palavra "URGENTE", teoria conspiratória sem fonte e apelo emocional ao compartilhamento.',
    tips: [
      'Busque a informação em veículos de comunicação reconhecidos.',
      'Desconfie de notícias sem fonte ou autoria.',
      'O pedido de "compartilhe antes que censurem" é sinal de desinformação.',
    ],
  },
  {
    id: 3,
    category: 'GOLPE PIX',
    content:
      'Olá! Sou da central do seu banco. Identificamos uma transferência suspeita de R$1.500 na sua conta. Para cancelar, me informe seu token de segurança.',
    isThreat: true,
    explanation:
      'Golpe do falso suporte bancário: solicita token/senha por mensagem, o que bancos legítimos nunca fazem.',
    tips: [
      'Nunca forneça token ou senha por telefone ou mensagem.',
      'Ligue diretamente para o número oficial do seu banco.',
      'Bancos não pedem cancelamento de transações via chat.',
    ],
  },
  {
    id: 4,
    category: 'CONFIÁVEL',
    content:
      'O Ministério da Saúde divulgou hoje o calendário de vacinação 2026. Acesse o site oficial gov.br/saude para consultar as datas.',
    isThreat: false,
    explanation:
      'Conteúdo legítimo: fonte oficial identificada (gov.br), sem urgência artificial e sem solicitação de dados.',
    tips: [
      'Sites gov.br são fontes oficiais do governo brasileiro.',
      'Conteúdo confiável cita a fonte de forma verificável.',
    ],
  },
  {
    id: 5,
    category: 'ENGENHARIA SOCIAL',
    content:
      'Parabéns! Você foi selecionado para ganhar um iPhone 15. Clique aqui e preencha seus dados para receber o prêmio: http://premios-gratis.net/iphone',
    isThreat: true,
    explanation:
      'Golpe de prêmio falso: oferta irreal, domínio suspeito e coleta de dados pessoais são os sinais típicos.',
    tips: [
      'Ninguém ganha prêmios sem participar de um sorteio.',
      'Domínios como "premios-gratis.net" não são empresas reais.',
      'Nunca preencha dados pessoais em links recebidos por mensagem.',
    ],
  },
  {
    id: 6,
    category: 'SPAM',
    content:
      'Ganhe R$5.000 por semana trabalhando de casa! Sem experiência necessária. Vagas limitadas. Responda JÁ!',
    isThreat: true,
    explanation:
      'Oferta de emprego fraudulenta: promessa de ganho irreal, urgência ("JÁ!") e ausência de qualquer informação sobre a empresa.',
    tips: [
      'Propostas legítimas de emprego têm CNPJ, site e processo seletivo.',
      'Renda garantida sem esforço é sempre golpe.',
      'Pesquise a empresa antes de responder qualquer proposta.',
    ],
  },
];

export const getScenarios = () =>
  SCENARIOS.map(({ id, category, content }) => ({ id, category, content }));

export const checkAnswer = (scenarioId: number, userAnswer: boolean) => {
  const scenario = SCENARIOS.find((s) => s.id === scenarioId);
  if (!scenario) throw new Error('Cenário não encontrado');

  const correct = userAnswer === scenario.isThreat;
  return {
    correct,
    isThreat:    scenario.isThreat,
    explanation: scenario.explanation,
    tips:        scenario.tips,
  };
};
