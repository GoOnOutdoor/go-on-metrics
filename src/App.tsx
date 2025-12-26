import { useState, useCallback, useMemo } from 'react';
import type { ViewType, MetricasProfessor, Atleta, ResumoGeral, TipoAba } from './types';
import { parseFile, detectColumnMapping, validateColumns, processData } from './lib/parser';
import { calcularTodasMetricas, calcularMetricasForca, calcularResumoGeral, calcularMetricasGeral } from './lib/calculations';
import { UploadZone } from './components/Upload/UploadZone';
import { DashboardHeader } from './components/Dashboard/DashboardHeader';
import { SummaryCards } from './components/Dashboard/SummaryCards';
import { ProfessorGrid } from './components/Dashboard/ProfessorGrid';
import { ProfessorDetails } from './components/Details/ProfessorDetails';
import { MonthSelector } from './components/Dashboard/MonthSelector';
import { TabNavigation } from './components/Navigation/TabNavigation';
import { CohortTable } from './components/Cohort/CohortTable';
import { AthleteManagement } from './components/Management/AthleteManagement';
import { HealthDashboard } from './components/Health/HealthDashboard';

// Dados persistidos no localStorage
interface DadosSalvos {
  atletas: Atleta[];
  dataProcessamento: Date;
}

function carregarDadosPersistidos(): DadosSalvos | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem('dadosAtletas');
    if (!saved) return null;
    const parsed = JSON.parse(saved) as { atletas?: Atleta[]; dataProcessamento?: string };
    if (!parsed.atletas || !Array.isArray(parsed.atletas) || parsed.atletas.length === 0) return null;
    const atletasConvertidos = parsed.atletas.map((a) => ({
      ...a,
      dataEntrada: new Date(a.dataEntrada),
      dataSaida: a.dataSaida ? new Date(a.dataSaida as unknown as string) : null,
    }));
    return {
      atletas: atletasConvertidos,
      dataProcessamento: parsed.dataProcessamento ? new Date(parsed.dataProcessamento) : new Date(),
    };
  } catch {
    return null;
  }
}

function App() {
  const persisted = carregarDadosPersistidos();
  const [view, setView] = useState<ViewType>(persisted ? 'dashboard' : 'upload');
  const [atletas, setAtletas] = useState<Atleta[]>(persisted?.atletas ?? []);
  const [dataProcessamento, setDataProcessamento] = useState<Date>(persisted?.dataProcessamento ?? new Date());
  const [mesReferencia, setMesReferencia] = useState<Date>(new Date());
  const [selectedProfessor, setSelectedProfessor] = useState<MetricasProfessor | null>(null);
  const [activeTab, setActiveTab] = useState<TipoAba>('corrida');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persistAtletas = useCallback((lista: Atleta[]) => {
    setAtletas(lista);
    const agora = new Date();
    setDataProcessamento(agora);
    const dadosSalvos: DadosSalvos = {
      atletas: lista,
      dataProcessamento: agora,
    };
    localStorage.setItem('dadosAtletas', JSON.stringify(dadosSalvos));
  }, []);

  // Recalcular métricas para CORRIDA quando o mês de referência mudar
  const professoresCorrida = useMemo(() => {
    if (atletas.length === 0) return [];
    return calcularTodasMetricas(atletas, mesReferencia);
  }, [atletas, mesReferencia]);

  // Recalcular métricas para FORÇA quando o mês de referência mudar
  const professoresForca = useMemo(() => {
    if (atletas.length === 0) return [];
    return calcularMetricasForca(atletas, mesReferencia);
  }, [atletas, mesReferencia]);

  // Recalcular métricas para GERAL quando o mês de referência mudar
  const professoresGeral = useMemo(() => {
    if (atletas.length === 0) return [];
    return calcularMetricasGeral(atletas, mesReferencia);
  }, [atletas, mesReferencia]);

  // Professores ativos baseado na aba selecionada
  const professores =
    activeTab === 'corrida'
      ? professoresCorrida
      : activeTab === 'forca'
        ? professoresForca
        : professoresGeral;

  // Resumo da aba corrida
  const resumoCorrida: ResumoGeral | null = useMemo(() => {
    if (atletas.length === 0) return null;
    return calcularResumoGeral(atletas, professoresCorrida, mesReferencia, 'corrida');
  }, [atletas, professoresCorrida, mesReferencia]);

  // Resumo da aba força
  const resumoForca: ResumoGeral | null = useMemo(() => {
    if (atletas.length === 0) return null;
    return calcularResumoGeral(atletas, professoresForca, mesReferencia, 'forca');
  }, [atletas, professoresForca, mesReferencia]);

  // Resumo geral (corrida + força)
  const resumoGeral: ResumoGeral | null = useMemo(() => {
    if (atletas.length === 0) return null;
    return calcularResumoGeral(atletas, professoresGeral, mesReferencia, 'geral');
  }, [atletas, professoresGeral, mesReferencia]);

  // Resumo ativo baseado na aba selecionada
  const resumo =
    activeTab === 'corrida'
      ? resumoCorrida
      : activeTab === 'forca'
        ? resumoForca
        : resumoGeral;

  const handleFileSelect = useCallback(async (file: File, mes: number, ano: number) => {
    setIsLoading(true);
    setError(null);

    try {
      // Parse do arquivo
      const rawData = await parseFile(file);

      // Detectar e validar colunas
      const mapping = detectColumnMapping(rawData);
      const validation = validateColumns(rawData, mapping);

      if (!validation.valid) {
        throw new Error(`Colunas obrigatórias não encontradas: ${validation.missing.join(', ')}`);
      }

      // Processar dados
      const atletasProcessados = processData(rawData, mapping);

      if (atletasProcessados.length === 0) {
        throw new Error('Nenhum atleta encontrado na planilha');
      }

      // Definir mês de referência inicial
      const mesRef = new Date(ano, mes - 1, 15);

      persistAtletas(atletasProcessados);
      setMesReferencia(mesRef);
      setView('dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar arquivo');
    } finally {
      setIsLoading(false);
    }
  }, [persistAtletas]);

  const handleMesChange = useCallback((novoMes: Date) => {
    setMesReferencia(novoMes);
    // Limpar professor selecionado ao mudar o mês
    setSelectedProfessor(null);
  }, []);

  const handleTabChange = useCallback((tab: TipoAba) => {
    setActiveTab(tab);
    // Limpar professor selecionado ao mudar de aba
    setSelectedProfessor(null);
  }, []);

  const handleSalvarAtletas = useCallback((lista: Atleta[]) => {
    persistAtletas(lista);
    // Após salvar, manter mês e aba; recalculados via useMemo
  }, [persistAtletas]);

  const handleSelectProfessor = useCallback((professor: MetricasProfessor) => {
    setSelectedProfessor(professor);
    setView('details');
  }, []);

  const downloadFile = useCallback((content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, []);

  const handleExportJson = useCallback(() => {
    if (!atletas.length) return;
    downloadFile(JSON.stringify(atletas, null, 2), 'goon-atletas.json', 'application/json');
  }, [atletas, downloadFile]);

  const handleExportCsv = useCallback(() => {
    if (!atletas.length) return;
    const header = [
      'id',
      'nome',
      'treinador',
      'treinadorForca',
      'status',
      'dataEntrada',
      'dataSaida',
      'plano',
      'tempoMeses',
      'tempoAteChurn',
    ];
    const rows = atletas.map((a) => [
      a.id,
      a.nome,
      a.treinador,
      a.treinadorForca || '',
      a.status,
      a.dataEntrada.toISOString(),
      a.dataSaida ? a.dataSaida.toISOString() : '',
      a.plano || '',
      a.tempoMeses,
      a.tempoAteChurn ?? '',
    ]);
    const csv = [header, ...rows]
      .map((cols) =>
        cols
          .map((val) => {
            const v = String(val ?? '');
            const needsQuote = v.includes(',') || v.includes('"') || v.includes('\n');
            if (needsQuote) {
              return `"${v.replace(/"/g, '""')}"`;
            }
            return v;
          })
          .join(',')
      )
      .join('\n');
    downloadFile(csv, 'goon-atletas.csv', 'text/csv;charset=utf-8;');
  }, [atletas, downloadFile]);

  // Renderização condicional por view
  if (view === 'upload') {
    return (
      <UploadZone
        onFileSelect={handleFileSelect}
        onBack={() => atletas.length > 0 && setView('dashboard')}
        isLoading={isLoading}
        error={error}
        hasSavedData={atletas.length > 0}
        onResumeSaved={() => setView('dashboard')}
      />
    );
  }

  if (view === 'details' && selectedProfessor && atletas.length > 0) {
    // Recalcular o professor selecionado com o mês atual
    const professorAtualizado = professores.find(
      (p) => p.nome.toLowerCase() === selectedProfessor.nome.toLowerCase()
    );

    if (professorAtualizado) {
      return (
        <ProfessorDetails
          professor={professorAtualizado}
          atletas={atletas}
          tipo={activeTab}
          onBack={() => {
            setSelectedProfessor(null);
            setView('dashboard');
          }}
        />
      );
    }
  }

  if (view === 'management') {
    return (
      <AthleteManagement
        atletas={atletas}
        onSave={handleSalvarAtletas}
        onBack={() => setView(atletas.length > 0 ? 'dashboard' : 'upload')}
      />
    );
  }

  if (view === 'health' && atletas.length > 0 && resumo) {
    return (
      <HealthDashboard
        resumo={resumo}
        professores={professores}
        atletas={atletas}
        mesReferencia={mesReferencia}
        tipo={activeTab}
        onBack={() => setView('dashboard')}
      />
    );
  }

  if (view === 'dashboard' && atletas.length > 0 && resumo) {
    const tipoLabel =
      activeTab === 'corrida'
        ? 'Treinadores de Corrida'
        : activeTab === 'forca'
          ? 'Treinadores de Força'
          : 'Treinadores (Geral)';

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="py-6 border-b border-gray-200">
            <DashboardHeader
              onNovoRelatorio={() => setView('upload')}
              dataProcessamento={dataProcessamento}
              onOpenManagement={() => setView('management')}
              onExportCsv={handleExportCsv}
              onExportJson={handleExportJson}
              onOpenHealth={() => setView('health')}
            />
          </div>

          {/* Abas de navegação */}
          <div className="mt-4">
            <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
          </div>

          {/* Seletor de mês */}
          <div className="mt-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Mês de Referência</h2>
            <MonthSelector
              mesReferencia={mesReferencia}
              onMesChange={handleMesChange}
            />
          </div>

          <div className="mt-6 space-y-6 pb-8">
            {/* Resumo geral */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Resumo Geral - {activeTab === 'corrida' ? 'Corrida' : 'Força'}
              </h2>
              <SummaryCards resumo={resumo} />
            </section>

            {/* Grid de professores */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {tipoLabel} ({professores.length})
              </h2>
              <ProfessorGrid
                professores={professores}
                onSelectProfessor={handleSelectProfessor}
              />
            </section>

            {/* Tabela de Cohort */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Análise de Cohort - {activeTab === 'corrida' ? 'Corrida' : 'Força'}
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Retenção de atletas por mês de entrada (a partir de 2024)
              </p>
              <CohortTable
                atletas={atletas}
                tipo={activeTab}
                anoInicio={2024}
              />
            </section>
          </div>
        </div>
      </div>
    );
  }

  // Fallback para upload se não há dados
  return (
    <UploadZone
      onFileSelect={handleFileSelect}
      onBack={() => {}}
      isLoading={isLoading}
      error={error}
    />
  );
}

export default App;
