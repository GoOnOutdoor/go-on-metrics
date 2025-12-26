import type { MetricasProfessor, StatusCor } from '../../types';
import { cn } from '../../lib/utils';
import { ChevronRight } from 'lucide-react';
import { STATUS_COLORS } from '../../lib/thresholds';

interface Props {
  professor: MetricasProfessor;
  onClick: () => void;
}

export function ProfessorCard({ professor, onClick }: Props) {
  const colors = STATUS_COLORS[professor.statusGeral];

  return (
    <div
      onClick={onClick}
      className={cn(
        'p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md',
        colors.bgLight,
        colors.border
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn('w-3 h-3 rounded-full', colors.bg)} />
          <h3 className="font-semibold text-gray-900 truncate">{professor.nome}</h3>
        </div>
        <span className="text-sm text-gray-500 whitespace-nowrap">{professor.atletasAtivos} ativos</span>
      </div>

      {/* Métricas */}
      <div className="space-y-2">
        <MetricaRow
          label="Churn Mensal"
          valor={`${professor.churnMensal.valor.toFixed(1)}%`}
          status={professor.churnMensal.status}
        />
        <MetricaRow
          label="Entradas"
          valor={professor.entradasMes.toString()}
        />
        <MetricaRow
          label="Saídas"
          valor={professor.saidasMes.toString()}
        />
        <MetricaRow
          label="Saldo Líquido"
          valor={professor.saldoLiquido.valor > 0 ? `+${professor.saldoLiquido.valor}` : String(professor.saldoLiquido.valor)}
          status={professor.saldoLiquido.status}
        />
        <MetricaRow
          label="Base início"
          valor={professor.baseInicioMes.toString()}
        />
        <MetricaRow
          label="Base fim"
          valor={professor.baseFimMes.toString()}
        />
        <MetricaRow
          label="Retenção 3m"
          valor={`${professor.retencaoTrimestral.valor.toFixed(0)}%`}
          status={professor.retencaoTrimestral.status}
        />
        <MetricaRow
          label="Retenção 6m"
          valor={`${professor.retencaoSemestral.valor.toFixed(0)}%`}
          status={professor.retencaoSemestral.status}
        />
        <MetricaRow
          label="Retenção 12m"
          valor={`${professor.retencaoAnual.valor.toFixed(0)}%`}
          status={professor.retencaoAnual.status}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end mt-3 pt-3 border-t border-gray-200/50">
        <span className="text-sm text-gray-500 flex items-center">
          Detalhes <ChevronRight className="w-4 h-4" />
        </span>
      </div>
    </div>
  );
}

function MetricaRow({ label, valor, status }: { label: string; valor: string; status?: StatusCor }) {
  const colors = status ? STATUS_COLORS[status] : null;

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-medium">{valor}</span>
        {colors && <div className={cn('w-2 h-2 rounded-full', colors.bg)} />}
      </div>
    </div>
  );
}
