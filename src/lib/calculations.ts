import type { Atleta, MetricasProfessor, ResumoGeral } from '../types';
import {
  getChurnStatus,
  getSaldoStatus,
  getRetencaoStatus,
  getStatusGeral,
} from './thresholds';
import { isTreinadorExcluido } from './config';
import {
  startOfMonth,
  endOfMonth,
  differenceInMonths,
  isBefore,
  isWithinInterval,
} from 'date-fns';

export type TipoTreinador = 'corrida' | 'forca' | 'geral';

/**
 * Calcula todas as métricas para um professor específico
 */
export function calcularMetricasProfessor(
  atletas: Atleta[],
  nomeProfessor: string,
  mesReferencia: Date,
  tipo: TipoTreinador = 'corrida'
): MetricasProfessor {
  const alvo = nomeProfessor.toLowerCase();
  // Filtrar atletas deste professor baseado no tipo
  const atletasProfessor = atletas.filter((a) => {
    if (tipo === 'corrida') {
      return a.treinador.toLowerCase() === alvo;
    }
    if (tipo === 'forca') {
      return a.treinadorForca?.toLowerCase() === alvo;
    }
    // geral: conta se é treinador de corrida ou de força
    return (
      a.treinador.toLowerCase() === alvo ||
      a.treinadorForca?.toLowerCase() === alvo
    );
  });

  const inicioMes = startOfMonth(mesReferencia);
  const fimMes = endOfMonth(mesReferencia);

  // ===== CONTAGENS BÁSICAS =====
  const ativos = atletasProfessor.filter((a) => a.status === 'Ativo');
  const inativos = atletasProfessor.filter((a) => a.status === 'Inativo');

  // ===== ENTRADAS DO MÊS =====
  const entradasMes = atletasProfessor.filter((a) =>
    isWithinInterval(a.dataEntrada, { start: inicioMes, end: fimMes })
  ).length;

  // ===== SAÍDAS DO MÊS =====
  const saidasMes = atletasProfessor.filter(
    (a) =>
      a.status === 'Inativo' &&
      a.dataSaida &&
      isWithinInterval(a.dataSaida, { start: inicioMes, end: fimMes })
  ).length;

  // ===== BASE NO INÍCIO DO MÊS =====
  const baseInicioMes = atletasProfessor.filter((a) => {
    const entrouAntes = isBefore(a.dataEntrada, inicioMes);
    const aindaAtivo =
      a.status === 'Ativo' ||
      (a.dataSaida && !isBefore(a.dataSaida, inicioMes));
    return entrouAntes && aindaAtivo;
  }).length;

  // ===== CHURN MENSAL =====
  const churnMensalValor =
    baseInicioMes > 0 ? (saidasMes / baseInicioMes) * 100 : 0;

  // ===== SALDO LÍQUIDO =====
  const saldoLiquidoValor = entradasMes - saidasMes;

  // ===== RETENÇÕES =====
  const retencaoTrimestralValor = calcularRetencao(
    atletasProfessor,
    3,
    mesReferencia
  );
  const retencaoSemestralValor = calcularRetencao(
    atletasProfessor,
    6,
    mesReferencia
  );
  const retencaoAnualValor = calcularRetencao(
    atletasProfessor,
    12,
    mesReferencia
  );

  // ===== APLICAR THRESHOLDS =====
  const churnStatus = getChurnStatus(churnMensalValor);
  const saldoStatus = getSaldoStatus(saldoLiquidoValor);
  const ret3mStatus = getRetencaoStatus(retencaoTrimestralValor, 'trimestral');
  const ret6mStatus = getRetencaoStatus(retencaoSemestralValor, 'semestral');
  const ret12mStatus = getRetencaoStatus(retencaoAnualValor, 'anual');

  const statusGeral = getStatusGeral({
    churn: churnStatus,
    ret3m: ret3mStatus,
    ret6m: ret6mStatus,
    ret12m: ret12mStatus,
    saldo: saldoStatus,
  });

  return {
    nome: nomeProfessor,
    totalHistorico: atletasProfessor.length,
    atletasAtivos: ativos.length,
    atletasInativos: inativos.length,
    entradasMes,
    saidasMes,
    baseInicioMes,
    baseFimMes: baseInicioMes + entradasMes - saidasMes,
    churnMensal: { valor: churnMensalValor, status: churnStatus },
    saldoLiquido: { valor: saldoLiquidoValor, status: saldoStatus },
    retencaoTrimestral: {
      valor: retencaoTrimestralValor,
      status: ret3mStatus,
    },
    retencaoSemestral: { valor: retencaoSemestralValor, status: ret6mStatus },
    retencaoAnual: { valor: retencaoAnualValor, status: ret12mStatus },
    statusGeral,
  };
}

/**
 * Calcula taxa de retenção para um período em meses
 */
function calcularRetencao(
  atletas: Atleta[],
  mesesMinimo: number,
  dataReferencia: Date
): number {
  // Atletas elegíveis: entraram há pelo menos X meses
  const elegiveis = atletas.filter((a) => {
    const mesesDesdeEntrada = differenceInMonths(dataReferencia, a.dataEntrada);
    return mesesDesdeEntrada >= mesesMinimo;
  });

  if (elegiveis.length === 0) return 100; // Sem dados suficientes

  // Atletas que ficaram pelo menos X meses
  const retidos = elegiveis.filter((a) => {
    if (a.status === 'Ativo') {
      return differenceInMonths(dataReferencia, a.dataEntrada) >= mesesMinimo;
    } else {
      return a.tempoMeses >= mesesMinimo;
    }
  });

  return (retidos.length / elegiveis.length) * 100;
}

/**
 * Calcula métricas para todos os professores de corrida
 */
export function calcularTodasMetricas(
  atletas: Atleta[],
  mesReferencia: Date
): MetricasProfessor[] {
  return calcularMetricasPorTipo(atletas, mesReferencia, 'corrida');
}

/**
 * Calcula métricas para todos os treinadores de força
 */
export function calcularMetricasForca(
  atletas: Atleta[],
  mesReferencia: Date
): MetricasProfessor[] {
  return calcularMetricasPorTipo(atletas, mesReferencia, 'forca');
}

/**
 * Calcula métricas combinadas (corrida + força)
 */
export function calcularMetricasGeral(
  atletas: Atleta[],
  mesReferencia: Date
): MetricasProfessor[] {
  return calcularMetricasPorTipo(atletas, mesReferencia, 'geral');
}

/**
 * Calcula métricas por tipo de treinador
 */
function calcularMetricasPorTipo(
  atletas: Atleta[],
  mesReferencia: Date,
  tipo: TipoTreinador
): MetricasProfessor[] {
  // Extrair lista única de professores baseado no tipo
  let professores: string[];

  if (tipo === 'corrida') {
    professores = [...new Set(atletas.map((a) => a.treinador))].filter(
      (nome) => !isTreinadorExcluido(nome)
    );
  } else if (tipo === 'forca') {
    // Para força, usar treinadorForca e excluir "Ninguém"
    professores = [
      ...new Set(
        atletas
          .map((a) => a.treinadorForca)
          .filter((nome): nome is string =>
            nome !== null &&
            nome.toLowerCase() !== 'ninguém' &&
            nome.toLowerCase() !== 'ninguem' &&
            nome.trim() !== ''
          )
      ),
    ].filter((nome) => !isTreinadorExcluido(nome));
  } else {
    // Geral: união dos dois conjuntos, excluindo vazios e "Ninguém"
    const corrida = atletas.map((a) => a.treinador);
    const forca = atletas
      .map((a) => a.treinadorForca)
      .filter((nome): nome is string =>
        nome !== null &&
        nome.toLowerCase() !== 'ninguém' &&
        nome.toLowerCase() !== 'ninguem' &&
        nome.trim() !== ''
      );
    professores = [...new Set([...corrida, ...forca])].filter(
      (nome) => nome.trim() !== '' && !isTreinadorExcluido(nome)
    );
  }

  return professores
    .map((prof) => calcularMetricasProfessor(atletas, prof, mesReferencia, tipo))
    .sort((a, b) => {
      // Ordenar: verdes primeiro, depois amarelos, depois vermelhos
      const ordem = { verde: 0, amarelo: 1, vermelho: 2 };
      if (ordem[a.statusGeral] !== ordem[b.statusGeral]) {
        return ordem[a.statusGeral] - ordem[b.statusGeral];
      }
      // Dentro do mesmo status, ordenar por número de ativos (decrescente)
      return b.atletasAtivos - a.atletasAtivos;
    });
}

/**
 * Calcula resumo geral da empresa
 */
export function calcularResumoGeral(
  atletas: Atleta[],
  professores: MetricasProfessor[],
  mesReferencia: Date,
  tipo: TipoTreinador = 'corrida'
): ResumoGeral {
  const inicioMes = startOfMonth(mesReferencia);
  const fimMes = endOfMonth(mesReferencia);

  // Filtrar atletas baseado no tipo
  let atletasFiltrados: Atleta[];

  if (tipo === 'corrida') {
    atletasFiltrados = atletas.filter(
      (a) => !isTreinadorExcluido(a.treinador)
    );
  } else if (tipo === 'forca') {
    // Para força, filtrar apenas atletas com treinador de força válido (excluindo "Ninguém")
    atletasFiltrados = atletas.filter(
      (a) =>
        a.treinadorForca !== null &&
        a.treinadorForca.toLowerCase() !== 'ninguém' &&
        a.treinadorForca.toLowerCase() !== 'ninguem' &&
        a.treinadorForca.trim() !== '' &&
        !isTreinadorExcluido(a.treinadorForca)
    );
  } else {
    // Geral: incluir atletas que tenham pelo menos um treinador válido (corrida ou força) não excluído
    atletasFiltrados = atletas.filter((a) => {
      const corridaValida = a.treinador.trim() !== '' && !isTreinadorExcluido(a.treinador);
      const forcaValida =
        a.treinadorForca &&
        a.treinadorForca.trim() !== '' &&
        a.treinadorForca.toLowerCase() !== 'ninguém' &&
        a.treinadorForca.toLowerCase() !== 'ninguem' &&
        !isTreinadorExcluido(a.treinadorForca);
      return corridaValida || forcaValida;
    });
  }

  const ativos = atletasFiltrados.filter((a) => a.status === 'Ativo').length;
  const inativos = atletasFiltrados.filter((a) => a.status === 'Inativo').length;

  const entradasMes = atletasFiltrados.filter((a) =>
    isWithinInterval(a.dataEntrada, { start: inicioMes, end: fimMes })
  ).length;

  const saidasMes = atletasFiltrados.filter(
    (a) =>
      a.status === 'Inativo' &&
      a.dataSaida &&
      isWithinInterval(a.dataSaida, { start: inicioMes, end: fimMes })
  ).length;

  const baseInicioMes = atletasFiltrados.filter((a) => {
    const entrouAntes = isBefore(a.dataEntrada, inicioMes);
    const aindaAtivo =
      a.status === 'Ativo' ||
      (a.dataSaida && !isBefore(a.dataSaida, inicioMes));
    return entrouAntes && aindaAtivo;
  }).length;

  const churnGeral =
    baseInicioMes > 0 ? (saidasMes / baseInicioMes) * 100 : 0;

  return {
    totalAtletas: atletasFiltrados.length,
    totalAtivos: ativos,
    totalInativos: inativos,
    baseInicioMes,
    baseFimMes: baseInicioMes + entradasMes - saidasMes,
    entradasMes,
    saidasMes,
    churnGeralMes: churnGeral,
    saldoGeralMes: entradasMes - saidasMes,
    professoresVerdes: professores.filter((p) => p.statusGeral === 'verde')
      .length,
    professoresAmarelos: professores.filter((p) => p.statusGeral === 'amarelo')
      .length,
    professoresVermelhos: professores.filter(
      (p) => p.statusGeral === 'vermelho'
    ).length,
  };
}
