import { useState } from 'react';
import type { MetricasProfessor, Atleta, StatusCor } from '../../types';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ArrowLeft, Users, UserMinus, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { STATUS_COLORS } from '../../lib/thresholds';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CohortTableProfessor } from '../Cohort/CohortTableProfessor';

interface Props {
  professor: MetricasProfessor;
  atletas: Atleta[];
  onBack: () => void;
  tipo?: 'corrida' | 'forca' | 'geral';
}

export function ProfessorDetails({ professor, atletas, onBack, tipo = 'corrida' }: Props) {
  // Filtrar atletas baseado no tipo
  const atletasProfessor = atletas.filter((a) => {
    if (tipo === 'corrida') {
      return a.treinador.toLowerCase() === professor.nome.toLowerCase();
    } else if (tipo === 'forca') {
      return a.treinadorForca?.toLowerCase() === professor.nome.toLowerCase();
    }
    return (
      a.treinador.toLowerCase() === professor.nome.toLowerCase() ||
      a.treinadorForca?.toLowerCase() === professor.nome.toLowerCase()
    );
  });
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const atletasAtivos = atletasProfessor.filter((a) => a.status === 'Ativo');
  const atletasInativos = atletasProfessor.filter((a) => a.status === 'Inativo');
  const ativosParaMostrar = mostrarTodos ? atletasAtivos : atletasAtivos.slice(0, 20);
  const inativosParaMostrar = mostrarTodos ? atletasInativos : atletasInativos.slice(0, 10);
  const totalMostrados = ativosParaMostrar.length + inativosParaMostrar.length;
  const totalAtletas = atletasProfessor.length;

  const colors = STATUS_COLORS[professor.statusGeral];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className={cn('w-4 h-4 rounded-full', colors.bg)} />
              <h1 className="text-2xl font-bold text-gray-900">{professor.nome}</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {professor.atletasAtivos} atletas ativos • {professor.atletasInativos} inativos
            </p>
          </div>
          <div className={cn('px-4 py-2 rounded-lg font-medium uppercase text-sm', colors.bgLight, colors.text)}>
            {professor.statusGeral}
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{professor.atletasAtivos}</p>
                <p className="text-sm text-gray-500">Ativos</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <UserMinus className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{professor.atletasInativos}</p>
                <p className="text-sm text-gray-500">Inativos</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">+{professor.entradasMes}</p>
                <p className="text-sm text-gray-500">Entradas</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">-{professor.saidasMes}</p>
                <p className="text-sm text-gray-500">Saídas</p>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:gap-6">
                <div>
                  <p className="text-lg font-bold text-gray-900">{professor.baseInicioMes}</p>
                  <p className="text-xs text-gray-500">Base no início do mês</p>
                </div>
                <div className="h-10 w-px bg-gray-200 hidden md:block" />
                <div>
                  <p className="text-lg font-bold text-gray-900">{professor.baseFimMes}</p>
                  <p className="text-xs text-gray-500">Base no fim do mês</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métricas detalhadas */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Métricas do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <MetricaBar
                label="Churn Mensal"
                valor={professor.churnMensal.valor}
                formato="percent"
                status={professor.churnMensal.status}
                max={10}
                invertido
              />
              <MetricaBar
                label="Saldo Líquido"
                valor={professor.saldoLiquido.valor}
                formato="number"
                status={professor.saldoLiquido.status}
              />
              <MetricaBar
                label="Retenção Trimestral (3m)"
                valor={professor.retencaoTrimestral.valor}
                formato="percent"
                status={professor.retencaoTrimestral.status}
                max={100}
              />
              <MetricaBar
                label="Retenção Semestral (6m)"
                valor={professor.retencaoSemestral.valor}
                formato="percent"
                status={professor.retencaoSemestral.status}
                max={100}
              />
              <MetricaBar
                label="Retenção Anual (12m)"
                valor={professor.retencaoAnual.valor}
                formato="percent"
                status={professor.retencaoAnual.status}
                max={100}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Cohort do Professor */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Análise de Cohort</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Retenção de atletas por mês de entrada (a partir de 2024)
            </p>
            <CohortTableProfessor
              atletas={atletas}
              nomeProfessor={professor.nome}
              tipo={tipo}
              anoInicio={2024}
            />
          </CardContent>
        </Card>

        {/* Lista de atletas */}
        <Card>
          <CardHeader>
            <CardTitle>Atletas ({atletasProfessor.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-medium text-gray-500">Nome</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-500">Entrada</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-500">Tempo</th>
                    <th className="text-left py-3 px-2 font-medium text-gray-500">Plano</th>
                  </tr>
                </thead>
                <tbody>
                  {ativosParaMostrar.map((atleta) => (
                    <tr key={atleta.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2">{atleta.nome}</td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                          Ativo
                        </span>
                      </td>
                      <td className="py-3 px-2 text-gray-500">
                        {format(atleta.dataEntrada, 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="py-3 px-2 text-gray-500">{atleta.tempoMeses}m</td>
                      <td className="py-3 px-2 text-gray-500">{atleta.plano || '-'}</td>
                    </tr>
                  ))}
                  {inativosParaMostrar.map((atleta) => (
                    <tr key={atleta.id} className="border-b border-gray-100 hover:bg-gray-50 opacity-60">
                      <td className="py-3 px-2">{atleta.nome}</td>
                      <td className="py-3 px-2">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                          Inativo
                        </span>
                      </td>
                      <td className="py-3 px-2 text-gray-500">
                        {format(atleta.dataEntrada, 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="py-3 px-2 text-gray-500">{atleta.tempoMeses}m</td>
                      <td className="py-3 px-2 text-gray-500">{atleta.plano || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalAtletas > totalMostrados && (
                <div className="flex flex-col items-center gap-2 py-4">
                  <p className="text-sm text-gray-500">
                    Mostrando {totalMostrados} de {totalAtletas} atletas
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMostrarTodos(true)}
                  >
                    Ver todos
                  </Button>
                </div>
              )}
              {mostrarTodos && totalAtletas > 30 && (
                <div className="flex justify-center py-4">
                  <Button variant="ghost" size="sm" onClick={() => setMostrarTodos(false)}>
                    Mostrar menos
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface MetricaBarProps {
  label: string;
  valor: number;
  formato: 'percent' | 'number';
  status: StatusCor;
  max?: number;
  invertido?: boolean;
}

function MetricaBar({ label, valor, formato, status, max = 100, invertido = false }: MetricaBarProps) {
  const colors = STATUS_COLORS[status];
  const percentage = invertido
    ? Math.max(0, 100 - (valor / max) * 100)
    : Math.min(100, (valor / max) * 100);

  const valorFormatado = formato === 'percent'
    ? `${valor.toFixed(1)}%`
    : valor > 0 ? `+${valor}` : String(valor);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-medium">{valorFormatado}</span>
          <div className={cn('w-2 h-2 rounded-full', colors.bg)} />
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', colors.bg)}
          style={{ width: `${Math.max(5, percentage)}%` }}
        />
      </div>
    </div>
  );
}
