import { useMemo, useState } from 'react';
import type { Atleta } from '../../types';
import { calcularCohortProfessor, getCorRetencao } from '../../lib/cohort';
import { cn } from '../../lib/utils';
import { format, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  atletas: Atleta[];
  nomeProfessor: string;
  tipo: 'corrida' | 'forca' | 'geral';
  anoInicio?: number;
}

export function CohortTableProfessor({ atletas, nomeProfessor, tipo, anoInicio = 2024 }: Props) {
  const cohortData = useMemo(() => {
    return calcularCohortProfessor(atletas, nomeProfessor, anoInicio, tipo);
  }, [atletas, nomeProfessor, anoInicio, tipo]);
  const [selectedCohort, setSelectedCohort] = useState<{
    label: string;
    atletas: Atleta[];
  } | null>(null);

  if (cohortData.cohorts.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center text-gray-500">
        Nenhum dado de cohort disponível para este professor a partir de {anoInicio}.
      </div>
    );
  }

  // Gerar cabeçalhos de meses (M1, M2, M3, ...)
  const mesesHeaders = Array.from({ length: cohortData.maxMeses }, (_, i) => `M${i + 1}`);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-2 text-left font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10">
                Cohort
              </th>
              <th className="px-2 py-2 text-center font-semibold text-gray-700">
                N
              </th>
              {mesesHeaders.map((mes) => (
                <th key={mes} className="px-2 py-2 text-center font-semibold text-gray-600 min-w-[50px]">
                  {mes}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cohortData.cohorts.map((cohort, idx) => (
              <tr
                key={cohort.mesEntrada}
                className={cn(
                  'border-b border-gray-100',
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                )}
              >
                <td className="px-3 py-2 font-medium text-gray-900 sticky left-0 bg-inherit z-10 capitalize text-xs">
                  {cohort.mesEntradaLabel}
                </td>
                <td className="px-2 py-2 text-center font-medium text-gray-700 text-xs">
                  <button
                    className="underline underline-offset-2 text-emerald-700 hover:text-emerald-900"
                    onClick={() =>
                      setSelectedCohort({
                        label: cohort.mesEntradaLabel,
                        atletas: atletas.filter(
                          (a) =>
                            format(startOfMonth(a.dataEntrada), 'yyyy-MM') === cohort.mesEntrada
                        ),
                      })
                    }
                  >
                    {cohort.totalInicial}
                  </button>
                </td>
                {mesesHeaders.map((_, mesIdx) => {
                  const valor = cohort.retencao[mesIdx];

                  if (valor === undefined) {
                    return (
                      <td key={mesIdx} className="px-2 py-2 text-center text-gray-300 text-xs">
                        —
                      </td>
                    );
                  }

                  return (
                    <td key={mesIdx} className="px-2 py-2 text-center">
                      <span
                        className={cn(
                          'inline-block px-1.5 py-0.5 rounded text-xs font-medium min-w-[40px]',
                          getCorRetencao(valor)
                        )}
                      >
                        {valor.toFixed(0)}%
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedCohort && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 px-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <p className="text-sm text-gray-500">Cohort</p>
                <h3 className="text-lg font-semibold text-gray-900">{selectedCohort.label}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedCohort.atletas.length} atletas •{' '}
                  {selectedCohort.atletas.filter((a) => a.status === 'Ativo').length} ativos •{' '}
                  {selectedCohort.atletas.filter((a) => a.status === 'Inativo').length} inativos
                </p>
              </div>
              <button
                className="text-sm text-gray-600 hover:text-gray-900"
                onClick={() => setSelectedCohort(null)}
              >
                Fechar
              </button>
            </div>
            <div className="overflow-y-auto max-h-[65vh]">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2 font-semibold text-gray-700">Nome</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-700">Status</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-700">Treinador</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-700">Treinador força</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-700">Entrada</th>
                    <th className="text-left px-4 py-2 font-semibold text-gray-700">Saída</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedCohort.atletas
                    .slice()
                    .sort((a, b) => a.nome.localeCompare(b.nome))
                    .map((atleta) => (
                      <tr key={atleta.id} className="border-t border-gray-100">
                        <td className="px-4 py-2 text-gray-900">{atleta.nome}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              atleta.status === 'Ativo'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {atleta.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-700">{atleta.treinador || '-'}</td>
                        <td className="px-4 py-2 text-gray-700">{atleta.treinadorForca || '-'}</td>
                        <td className="px-4 py-2 text-gray-600">
                          {format(atleta.dataEntrada, 'dd/MM/yyyy', { locale: ptBR })}
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {atleta.dataSaida
                            ? format(atleta.dataSaida, 'dd/MM/yyyy', { locale: ptBR })
                            : '—'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
