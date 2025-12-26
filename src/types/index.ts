// ===== DADOS BRUTOS (importados da planilha) =====
export interface AtletaRaw {
  nome: string;
  treinador: string;
  treinadorForca?: string;
  status: string;
  dataEntrada: string | Date;
  dataSaida: string | Date | null;
  plano: string | null;
}

// ===== DADOS PROCESSADOS =====
export interface Atleta {
  id: string;
  nome: string;
  treinador: string;
  treinadorForca: string | null;
  status: 'Ativo' | 'Inativo';
  dataEntrada: Date;
  dataSaida: Date | null;
  plano: string | null; // Dinâmico - aceita qualquer plano da planilha
  tempoMeses: number;
  tempoAteChurn: number | null;
}

export type StatusCor = 'verde' | 'amarelo' | 'vermelho';

export interface MetricaStatus {
  valor: number;
  status: StatusCor;
}

export interface MetricasProfessor {
  nome: string;
  // Contagens
  totalHistorico: number;
  atletasAtivos: number;
  atletasInativos: number;
  // Métricas do mês
  entradasMes: number;
  saidasMes: number;
  baseInicioMes: number;
  baseFimMes: number;
  // Métricas calculadas
  churnMensal: MetricaStatus;
  saldoLiquido: MetricaStatus;
  retencaoTrimestral: MetricaStatus;
  retencaoSemestral: MetricaStatus;
  retencaoAnual: MetricaStatus;
  // Status geral
  statusGeral: StatusCor;
}

export interface ResumoGeral {
  totalAtletas: number;
  totalAtivos: number;
  totalInativos: number;
  baseInicioMes: number;
  baseFimMes: number;
  entradasMes: number;
  saidasMes: number;
  churnGeralMes: number;
  saldoGeralMes: number;
  professoresVerdes: number;
  professoresAmarelos: number;
  professoresVermelhos: number;
}

export interface Relatorio {
  id: string;
  mesReferencia: string;        // "2026-01"
  anoReferencia: number;
  dataProcessamento: Date;
  resumo: ResumoGeral;
  professores: MetricasProfessor[];
  atletas: Atleta[];
}

// ===== CONFIGURAÇÃO =====
export interface ThresholdConfig {
  churnMensal: { verde: number; amarelo: number };
  saldoLiquido: { verde: number; amarelo: number };
  retencaoTrimestral: { verde: number; amarelo: number };
  retencaoSemestral: { verde: number; amarelo: number };
  retencaoAnual: { verde: number; amarelo: number };
}

// ===== MAPEAMENTO DE COLUNAS =====
export interface ColumnMapping {
  nome: string;
  treinador: string;
  treinadorForca?: string;
  status: string;
  dataEntrada: string;
  dataSaida: string;
  plano?: string;
}

// ===== VIEWS =====
export type ViewType = 'dashboard' | 'upload' | 'details' | 'management' | 'health';
export type TipoAba = 'corrida' | 'forca' | 'geral';
