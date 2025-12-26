import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

interface Props {
  onFileSelect: (file: File, mes: number, ano: number) => void;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
  hasSavedData?: boolean;
  onResumeSaved?: () => void;
}

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function UploadZone({ onFileSelect, onBack, isLoading, error, hasSavedData, onResumeSaved }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
  });

  const handleProcess = () => {
    if (selectedFile) {
      onFileSelect(selectedFile, mes, ano);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Novo Relatório</h1>
            <p className="text-sm text-gray-500">Faça upload da planilha de atletas</p>
          </div>
        </div>

        {/* Seleção de período */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Mês de Referência</h2>
          <div className="flex gap-4">
            <select
              value={mes}
              onChange={(e) => setMes(Number(e.target.value))}
              className="flex-1 h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              {MESES.map((nome, i) => (
                <option key={i} value={i + 1}>{nome}</option>
              ))}
            </select>
            <select
              value={ano}
              onChange={(e) => setAno(Number(e.target.value))}
              className="w-28 h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              {[2024, 2025, 2026, 2027].map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Zona de upload */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
              selectedFile && 'border-green-500 bg-green-50'
            )}
          >
            <input {...getInputProps()} />

            {selectedFile ? (
              <div className="flex flex-col items-center gap-2">
                <FileSpreadsheet className="w-12 h-12 text-green-500" />
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">Clique para trocar arquivo</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-12 h-12 text-gray-400" />
                <p className="font-medium text-gray-900">
                  {isDragActive ? 'Solte o arquivo aqui' : 'Arraste a planilha ou clique para selecionar'}
                </p>
                <p className="text-sm text-gray-500">Formatos aceitos: .xlsx, .xls, .csv</p>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 mt-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {hasSavedData && onResumeSaved && (
            <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex flex-col gap-2">
              <p className="text-sm text-emerald-800">
                Você já tem dados processados nesta máquina. Pode continuar de onde parou ou subir um novo arquivo.
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={onResumeSaved}>
                  Continuar com dados salvos
                </Button>
              </div>
            </div>
          )}

          {/* Colunas obrigatórias */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Colunas esperadas na planilha:</h3>
            <div className="flex flex-wrap gap-2">
              {['Nome', 'Treinador', 'Status', 'Data entrada', 'Saida', 'Plano'].map((col) => (
                <span key={col} className="px-2 py-1 bg-white rounded border border-gray-200 text-xs text-gray-600">
                  {col}
                </span>
              ))}
            </div>
          </div>

          <div className="flex justify-end mt-6">
            <Button
              onClick={handleProcess}
              disabled={!selectedFile || isLoading}
              className="min-w-32"
            >
              {isLoading ? 'Processando...' : 'Processar'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
