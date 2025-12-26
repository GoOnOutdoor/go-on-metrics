import type { ThresholdConfig, StatusCor } from '../types';

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  churnMensal: { verde: 2, amarelo: 4 },           // ≤2% verde, 2-4% amarelo, >4% vermelho
  saldoLiquido: { verde: 0, amarelo: 0 },          // >0 verde, =0 amarelo, <0 vermelho
  retencaoTrimestral: { verde: 90, amarelo: 85 },  // ≥90% verde, 85-90% amarelo, <85% vermelho
  retencaoSemestral: { verde: 80, amarelo: 75 },   // ≥80% verde, 75-80% amarelo, <75% vermelho
  retencaoAnual: { verde: 75, amarelo: 70 },       // ≥75% verde, 70-75% amarelo, <70% vermelho
};

export function getChurnStatus(valor: number, config = DEFAULT_THRESHOLDS): StatusCor {
  if (valor <= config.churnMensal.verde) return 'verde';
  if (valor <= config.churnMensal.amarelo) return 'amarelo';
  return 'vermelho';
}

export function getSaldoStatus(valor: number, config = DEFAULT_THRESHOLDS): StatusCor {
  if (valor > config.saldoLiquido.verde) return 'verde';
  if (valor >= config.saldoLiquido.amarelo) return 'amarelo';
  return 'vermelho';
}

export function getRetencaoStatus(
  valor: number,
  tipo: 'trimestral' | 'semestral' | 'anual',
  config = DEFAULT_THRESHOLDS
): StatusCor {
  const thresholds = {
    trimestral: config.retencaoTrimestral,
    semestral: config.retencaoSemestral,
    anual: config.retencaoAnual,
  }[tipo];

  if (valor >= thresholds.verde) return 'verde';
  if (valor >= thresholds.amarelo) return 'amarelo';
  return 'vermelho';
}

export function getStatusGeral(metricas: {
  churn: StatusCor;
  ret3m: StatusCor;
  ret6m: StatusCor;
  ret12m: StatusCor;
  saldo?: StatusCor; // saldo não contamina
}): StatusCor {
  const principais = [metricas.churn, metricas.ret3m, metricas.ret6m, metricas.ret12m];

  if (principais.includes('vermelho')) return 'vermelho';
  if (principais.includes('amarelo')) return 'amarelo';
  return 'verde';
}

// Cores para UI
export const STATUS_COLORS = {
  verde: {
    bg: 'bg-green-500',
    bgLight: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
  },
  amarelo: {
    bg: 'bg-yellow-500',
    bgLight: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
  },
  vermelho: {
    bg: 'bg-red-500',
    bgLight: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
  },
} as const;
