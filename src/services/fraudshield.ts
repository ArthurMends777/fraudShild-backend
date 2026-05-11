const ML_API_URL = "http://localhost:8000";

export interface Classificacao {
  nivel: "confiavel" | "suspeito" | "alto_risco";
  emoji: string;
  label: string;
}

export interface PalavraChave {
  palavra: string;
  tipo: "suspeita" | "neutra" | "confiavel" | "duvida";
  contribuicao: number;
}

export interface ResultadoAnalise {
  texto: string;
  probabilidade_fake: number;
  probabilidade_true: number;
  classificacao: Classificacao;
  alertas: string[];
  palavras_chave: PalavraChave[];
}

export async function analisarTexto(
  texto: string,
  explicar: boolean = true
): Promise<ResultadoAnalise> {
  const response = await fetch(`${ML_API_URL}/analisar`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texto, explicar }),
  });

  if (!response.ok) {
    throw new Error(`Erro na API: ${response.status}`);
  }

  return response.json();
}

export async function verificarAPI(): Promise<boolean> {
  try {
    const response = await fetch(`${ML_API_URL}/`);
    return response.ok;
  } catch {
    return false;
  }
}