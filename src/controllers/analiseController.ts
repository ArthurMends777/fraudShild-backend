import { Request, Response } from 'express';
import { analisarTexto, verificarAPI } from "../services/fraudshield";
import { prisma } from '../lib/prisma';
import { AnalysisType, AnalysisResult } from '@prisma/client';

const mapNivelToResult = (nivel: string): AnalysisResult => {
  switch (nivel) {
    case 'confiavel':  return 'TRUE';
    case 'suspeito':   return 'SUSPECT';
    case 'alto_risco': return 'FALSE';
    default:           return 'SUSPECT';
  }
};

const mapType = (type?: string): AnalysisType => {
  switch (type?.toUpperCase()) {
    case 'URL':   return 'URL';
    case 'IMAGE': return 'IMAGE';
    default:      return 'TEXT';
  }
};

export async function analisar(req: Request, res: Response) {
  const { texto, type, sourceUrl, explicar = true } = req.body;

  if (!texto || texto.trim().length === 0) {
    return res.status(400).json({ erro: "Texto não pode ser vazio" });
  }

  if (texto.length > 5000) {
    return res.status(400).json({ erro: "Texto muito longo (máx 5000 caracteres)" });
  }

  try {
    const resultado = await analisarTexto(texto, explicar);

    await prisma.analysis.create({
      data: {
        userId:     req.user!.id,
        type:       mapType(type),
        content:    texto.substring(0, 1000), 
        sourceUrl:  sourceUrl || null,
        result:     mapNivelToResult(resultado.classificacao.nivel),
        confidence: resultado.probabilidade_fake,
        aiResponse: JSON.stringify({
          alertas:      resultado.alertas,
          palavras_chave: resultado.palavras_chave,
          evidencias:   resultado.evidencias,
        }),
      },
    });

    return res.json(resultado);
  } catch (error) {
    console.error("Erro ao chamar API Python:", error);
    return res.status(503).json({
      erro: "Serviço de análise indisponível. Tente novamente."
    });
  }
}

export async function mlHealthCheck(req: Request, res: Response) {
  const apiDisponivel = await verificarAPI();
  if (apiDisponivel) {
    return res.json({ status: "ok", api: "disponível" });
  } else {
    return res.status(503).json({ status: "error", api: "indisponível" });
  }
}