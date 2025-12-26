import { Upload, Download, ActivitySquare } from 'lucide-react';
import { Button } from '../ui/button';

interface Props {
  onNovoRelatorio: () => void;
  dataProcessamento?: Date;
  onOpenManagement?: () => void;
  onExportCsv?: () => void;
  onExportJson?: () => void;
  onOpenHealth?: () => void;
}

export function DashboardHeader({
  onNovoRelatorio,
  dataProcessamento,
  onOpenManagement,
  onExportCsv,
  onExportJson,
  onOpenHealth,
}: Props) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">GO ON METRICS</h1>
        {dataProcessamento && (
          <p className="text-sm text-gray-500 mt-1">
            Dados atualizados em: {dataProcessamento.toLocaleDateString('pt-BR')}
          </p>
        )}
      </div>
      <div className="flex gap-2 flex-wrap">
        {onOpenManagement && (
          <Button variant="outline" onClick={onOpenManagement}>
            Gestão de atletas
          </Button>
        )}
        {onOpenHealth && (
          <Button variant="outline" onClick={onOpenHealth}>
            <ActivitySquare className="w-4 h-4 mr-2" />
            Saúde
          </Button>
        )}
        {onExportCsv && (
          <Button variant="outline" onClick={onExportCsv}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        )}
        {onExportJson && (
          <Button variant="outline" onClick={onExportJson}>
            JSON
          </Button>
        )}
        <Button onClick={onNovoRelatorio}>
          <Upload className="w-4 h-4 mr-2" />
          Novo Relatório
        </Button>
      </div>
    </header>
  );
}
