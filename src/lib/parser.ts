import * as XLSX from 'xlsx';
import type { Atleta, ColumnMapping } from '../types';
import { differenceInMonths, parse, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const DEFAULT_COLUMN_MAPPING: ColumnMapping = {
  nome: 'Nome',
  treinador: 'Treinador',
  treinadorForca: 'Treinador de força',
  status: 'Status',
  dataEntrada: 'Data entrada',
  dataSaida: 'Saida',
  plano: 'Plano',
};

/**
 * Lê arquivo Excel/CSV e retorna array de objetos
 */
export async function parseFile(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });

        // Pegar primeira aba
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Converter para JSON
        const jsonData = XLSX.utils.sheet_to_json(sheet);

        resolve(jsonData as Record<string, unknown>[]);
      } catch {
        reject(new Error('Erro ao ler arquivo. Verifique o formato.'));
      }
    };

    reader.onerror = () => reject(new Error('Erro ao ler arquivo.'));
    reader.readAsBinaryString(file);
  });
}

/**
 * Detecta automaticamente o mapeamento de colunas
 */
export function detectColumnMapping(data: Record<string, unknown>[]): ColumnMapping {
  if (data.length === 0) throw new Error('Arquivo vazio');

  const firstRow = data[0];
  const columns = Object.keys(firstRow);

  const mapping: Partial<ColumnMapping> = {};

  // Padrões para detectar cada coluna
  const patterns: Record<string, RegExp> = {
    nome: /^(nome|atleta|aluno|name)$/i,
    treinador: /^(treinador|professor|coach|trainer)$/i,
    treinadorForca: /^(treinador.?(de)?.?for[cç]a|strength.?coach)$/i,
    status: /^(status|situação|situacao|ativo)$/i,
    dataEntrada: /^(data.?(de)?.?entrada|entrada|inicio|start|ingresso)$/i,
    dataSaida: /^(data.?(de)?.?sa[íi]da|sa[íi]da|saida|fim|end|cancelamento)$/i,
    plano: /^(plano|plan|tipo|categoria)$/i,
  };

  for (const [field, pattern] of Object.entries(patterns)) {
    const match = columns.find((col) => pattern.test(col.trim()));
    if (match) {
      mapping[field as keyof ColumnMapping] = match;
    }
  }

  return { ...DEFAULT_COLUMN_MAPPING, ...mapping };
}

/**
 * Valida se as colunas obrigatórias existem
 */
export function validateColumns(
  data: Record<string, unknown>[],
  mapping: ColumnMapping
): { valid: boolean; missing: string[] } {
  const required = ['nome', 'treinador', 'status', 'dataEntrada'];
  const firstRow = data[0];
  const columns = Object.keys(firstRow);

  const missing: string[] = [];

  for (const field of required) {
    const mappedColumn = mapping[field as keyof ColumnMapping];
    if (!mappedColumn || !columns.includes(mappedColumn)) {
      missing.push(field);
    }
  }

  return { valid: missing.length === 0, missing };
}

/**
 * Processa dados brutos e converte para formato tipado
 */
export function processData(
  rawData: Record<string, unknown>[],
  mapping: ColumnMapping
): Atleta[] {
  const hoje = new Date();

  return rawData
    .map((row, index) => {
      const dataEntrada = parseDate(row[mapping.dataEntrada]);
      const dataSaidaRaw = row[mapping.dataSaida];

      // Ignora fórmulas como =TODAY()
      const dataSaida =
        dataSaidaRaw &&
        typeof dataSaidaRaw === 'string' &&
        dataSaidaRaw.startsWith('=')
          ? null
          : parseDate(dataSaidaRaw);

      if (!dataEntrada) {
        console.warn(`Linha ${index + 2}: Data de entrada inválida`);
        return null;
      }

      const statusRaw = String(row[mapping.status] || '')
        .trim()
        .toLowerCase();
      const status: 'Ativo' | 'Inativo' =
        statusRaw === 'inativo' || statusRaw === 'inactive'
          ? 'Inativo'
          : 'Ativo';

      // Calcular tempo em meses
      const dataFim = status === 'Inativo' && dataSaida ? dataSaida : hoje;
      const tempoMeses = Math.max(0, differenceInMonths(dataFim, dataEntrada));

      // Tempo até churn (só para inativos)
      const tempoAteChurn =
        status === 'Inativo' && dataSaida
          ? differenceInMonths(dataSaida, dataEntrada)
          : null;

      // Plano dinâmico - aceita qualquer valor da planilha
      const planoRaw = String(row[mapping.plano || 'Plano'] || '').trim();
      const plano = planoRaw || null;

      // Treinador de força
      const treinadorForca = mapping.treinadorForca
        ? String(row[mapping.treinadorForca] || '').trim() || null
        : null;

      return {
        id: `${index}-${Date.now()}`,
        nome: String(row[mapping.nome] || '').trim(),
        treinador: String(row[mapping.treinador] || '').trim(),
        treinadorForca,
        status,
        dataEntrada,
        dataSaida,
        plano,
        tempoMeses,
        tempoAteChurn,
      };
    })
    .filter((a): a is Atleta => a !== null);
}

/**
 * Parse de data flexível (aceita vários formatos)
 */
function parseDate(value: unknown): Date | null {
  if (!value) return null;

  // Se já é Date
  if (value instanceof Date && isValid(value)) {
    return value;
  }

  const str = String(value).trim();

  // Ignora fórmulas do Excel
  if (str.startsWith('=')) return null;

  // Formatos comuns
  const formats = [
    'dd/MM/yyyy',
    'dd-MM-yyyy',
    'yyyy-MM-dd',
    'd/M/yyyy',
    'dd/MM/yy',
  ];

  for (const format of formats) {
    const parsed = parse(str, format, new Date(), { locale: ptBR });
    if (isValid(parsed)) {
      return parsed;
    }
  }

  // Tentar parse nativo
  const nativeParsed = new Date(str);
  if (isValid(nativeParsed)) {
    return nativeParsed;
  }

  return null;
}

