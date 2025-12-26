import type { Atleta } from '../types';
import { format, startOfMonth, endOfMonth, addMonths, differenceInMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { isTreinadorExcluido } from './config';

export interface CohortData {
  mesEntrada: string; // "2024-01"
  mesEntradaLabel: string; // "Jan 2024"
  totalInicial: number;
  retencao: number[]; // Array com % de retenção por mês (0 = mês 1, 1 = mês 2, etc.)
}

export interface CohortTable {
  cohorts: CohortData[];
  maxMeses: number;
}

/**
 * Calcula tabela de cohort para atletas
 * @param atletas Lista de atletas
 * @param anoInicio Ano inicial (default: 2024)
 * @param tipo Tipo de treinador para filtrar
 */
export function calcularCohort(
  atletas: Atleta[],
  anoInicio: number = 2024,
  tipo: 'corrida' | 'forca' | 'geral' = 'corrida'
): CohortTable {
  const dataInicio = new Date(anoInicio, 0, 1); // 1 de janeiro do ano inicial

  // Filtrar atletas baseado no tipo
  let atletasFiltrados: Atleta[];

  if (tipo === 'corrida') {
    atletasFiltrados = atletas.filter(
      (a) => !isTreinadorExcluido(a.treinador)
    );
  } else if (tipo === 'forca') {
    atletasFiltrados = atletas.filter(
      (a) =>
        a.treinadorForca !== null &&
        a.treinadorForca.toLowerCase() !== 'ninguém' &&
        a.treinadorForca.toLowerCase() !== 'ninguem' &&
        a.treinadorForca.trim() !== '' &&
        !isTreinadorExcluido(a.treinadorForca)
    );
  } else {
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

  // Filtrar apenas atletas que entraram a partir do ano inicial
  const atletasValidos = atletasFiltrados.filter(
    (a) => a.dataEntrada >= dataInicio
  );

  if (atletasValidos.length === 0) {
    return { cohorts: [], maxMeses: 0 };
  }

  // Maior data conhecida nos dados (fim da linha do tempo)
  const ultimaData = atletasValidos.reduce<Date>((maior, atleta) => {
    const fimAtleta = atleta.dataSaida || atleta.dataEntrada;
    return fimAtleta > maior ? fimAtleta : maior;
  }, dataInicio);
  const fimLinhaDoTempo = endOfMonth(ultimaData);

  // Agrupar por mês de entrada
  const grupos = new Map<string, Atleta[]>();

  for (const atleta of atletasValidos) {
    const mesKey = format(startOfMonth(atleta.dataEntrada), 'yyyy-MM');
    const grupo = grupos.get(mesKey) || [];
    grupo.push(atleta);
    grupos.set(mesKey, grupo);
  }

  // Calcular retenção para cada cohort
  const cohorts: CohortData[] = [];
  let maxMeses = 0;

  // Ordenar meses cronologicamente
  const mesesOrdenados = [...grupos.keys()].sort();

  for (const mesKey of mesesOrdenados) {
    const atletasMes = grupos.get(mesKey)!;
    const totalInicial = atletasMes.length;

    if (totalInicial === 0) continue;

    // Data de referência do cohort
    const [ano, mes] = mesKey.split('-').map(Number);
    const dataCohort = new Date(ano, mes - 1, 1);

    // Quantos meses temos de linha do tempo (do mês seguinte ao de entrada até o último mês com dado)
    const mesesDisponiveis = differenceInMonths(
      fimLinhaDoTempo,
      endOfMonth(dataCohort)
    );

    // Calcular retenção para cada mês
    const retencao: number[] = [];

    for (let m = 1; m <= mesesDisponiveis; m++) {
      // Mês de referência: m meses após o mês de entrada (M1 = mês seguinte)
      const fimMes = endOfMonth(addMonths(dataCohort, m));

      // Contar quantos atletas estavam ativos ao final desse mês
      const retidos = atletasMes.filter((a) => {
        // Atleta é contado se entrou até o fim do mês e não saiu antes ou no fim do mês
        const entrouAntesOuNoMes = a.dataEntrada <= fimMes;
        const aindaAtivoNoFimDoMes = !a.dataSaida || a.dataSaida > fimMes;
        return entrouAntesOuNoMes && aindaAtivoNoFimDoMes;
      }).length;

      const percentual = (retidos / totalInicial) * 100;
      retencao.push(percentual);
    }

    if (retencao.length > maxMeses) {
      maxMeses = retencao.length;
    }

    cohorts.push({
      mesEntrada: mesKey,
      mesEntradaLabel: format(dataCohort, "MMM ''yy", { locale: ptBR }),
      totalInicial,
      retencao,
    });
  }

  return { cohorts, maxMeses };
}

/**
 * Calcula cohort para um professor específico
 */
export function calcularCohortProfessor(
  atletas: Atleta[],
  nomeProfessor: string,
  anoInicio: number = 2024,
  tipo: 'corrida' | 'forca' | 'geral' = 'corrida'
): CohortTable {
  // Filtrar atletas do professor
  const atletasProfessor = atletas.filter((a) => {
    if (tipo === 'corrida') {
      return a.treinador.toLowerCase() === nomeProfessor.toLowerCase();
    } else if (tipo === 'forca') {
      return a.treinadorForca?.toLowerCase() === nomeProfessor.toLowerCase();
    }
    return (
      a.treinador.toLowerCase() === nomeProfessor.toLowerCase() ||
      a.treinadorForca?.toLowerCase() === nomeProfessor.toLowerCase()
    );
  });

  return calcularCohort(atletasProfessor, anoInicio, tipo);
}

/**
 * Retorna a cor baseada na porcentagem de retenção
 */
export function getCorRetencao(percentual: number): string {
  if (percentual >= 80) return 'bg-emerald-100 text-emerald-800';
  if (percentual >= 60) return 'bg-emerald-50 text-emerald-700';
  if (percentual >= 40) return 'bg-yellow-50 text-yellow-700';
  if (percentual >= 20) return 'bg-orange-50 text-orange-700';
  return 'bg-red-50 text-red-700';
}
