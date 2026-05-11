import { Request, Response } from 'express';
import { analisarTexto, verificarAPI } from "../services/fraudshield";

export async function analisar(req: Request, res: Response) {
  const { texto } = req.body;

  if (!texto || texto.trim().length === 0) {
    return res.status(400).json({ erro: "Texto não pode ser vazio" });
  }

  if (texto.length > 5000) {
    return res.status(400).json({ erro: "Texto muito longo (máx 5000 caracteres)" });
  }

  try {
    const resultado = await analisarTexto(texto);
    return res.json(resultado);
  } catch (error) {
    console.error("Erro ao chamar API Python:", error);
    return res.status(503).json({
      erro: "Serviço de análise indisponível. Tente novamente."
    });
  }
}

export async function healthCheck(req: Request, res: Response) {
  const apiDisponivel = await verificarAPI();
    if (apiDisponivel) {
        return res.json({ status: "ok", api: "disponível" });
    } else {
        return res.status(503).json({ status: "ok", api: "indisponível" });
    }
}