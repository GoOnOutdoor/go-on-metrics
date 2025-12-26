import { useMemo, type ReactNode } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import {
  Users,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Activity,
  ArrowLeft,
  BarChart3,
  CircleDot,
} from 'lucide-react';
import type { ResumoGeral, MetricasProfessor, Atleta } from '../../types';
import {
  addMonths,
  endOfMonth,
  format,
  startOfMonth,
  subMonths,
  differenceInMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { calcularResumoGeral, calcularTodasMetricas, calcularMetricasForca, calcularMetricasGeral } from '../../lib/calculations';
import { isTreinadorExcluido } from '../../lib/config';

interface Props {
  resumo: ResumoGeral;
  professores: MetricasProfessor[];
  atletas: Atleta[];
  mesReferencia: Date;
  tipo: 'corrida' | 'forca' | 'geral';
  onBack: () => void;
}

interface MonthlyPoint {
  label: string;
  date: Date;
  year: number;
  churn: number;
  saldo: number;
  baseInicio: number;
  baseFim: number;
  entradas: number;
  saidas: number;
  ret3m: number;
  ret6m: number;
  ret12m: number;
}

export function HealthDashboard({
  resumo,
  professores,
  atletas,
  mesReferencia,
  tipo,
  onBack,
}: Props) {
  const atletasFiltrados = useMemo(() => filtrarAtletasPorTipo(atletas, tipo), [atletas, tipo]);

  const monthlySeries = useMemo(
    () => construirSerieMensal(atletasFiltrados, mesReferencia, tipo),
    [atletasFiltrados, mesReferencia, tipo]
  );

  const ret3mAtual = useMemo(
    () => calcularRetencaoGeral(atletasFiltrados, mesReferencia, 3),
    [atletasFiltrados, mesReferencia]
  );
  const ret6mAtual = useMemo(
    () => calcularRetencaoGeral(atletasFiltrados, mesReferencia, 6),
    [atletasFiltrados, mesReferencia]
  );
  const ret12mAtual = useMemo(
    () => calcularRetencaoGeral(atletasFiltrados, mesReferencia, 12),
    [atletasFiltrados, mesReferencia]
  );

  const piorChurn = [...professores]
    .sort((a, b) => b.churnMensal.valor - a.churnMensal.valor)
    .slice(0, 3);
  const piorRetencao = [...professores]
    .sort((a, b) => a.retencaoSemestral.valor - b.retencaoSemestral.valor)
    .slice(0, 3);
  const mediasAnuais = useMemo(() => calcularMediasAnuais(monthlySeries), [monthlySeries]);
  const anoReferencia = mesReferencia.getFullYear();
  const mediaAnoRef = mediasAnuais.find((m) => m.ano === anoReferencia) ?? mediasAnuais.at(-1);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-8">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao dashboard
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Saúde da empresa</h1>
              <p className="text-sm text-gray-500">
                Referência: {format(mesReferencia, "MMMM 'de' yyyy", { locale: ptBR })} •{' '}
                {tipo === 'corrida' ? 'Corrida' : 'Força'}
              </p>
            </div>
          </div>
        </div>

        {/* Camada 1: Visão geral */}
        <section className="space-y-3" id="visao-geral">
          <h2 className="text-lg font-semibold text-gray-900">Visão geral</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <KpiCard icon={<Users className="w-5 h-5 text-blue-600" />} label="Ativos agora" value={resumo.totalAtivos} />
            <KpiCard
              icon={<Activity className="w-5 h-5 text-gray-700" />}
              label="Base início"
              value={resumo.baseInicioMes}
            />
            <KpiCard
              icon={<Activity className="w-5 h-5 text-gray-700" />}
              label="Base fim"
              value={resumo.baseFimMes}
            />
            <KpiCard
              icon={<TrendingDown className="w-5 h-5 text-red-600" />}
              label="Churn do mês"
              value={`${resumo.churnGeralMes.toFixed(1)}%`}
              tone={getChurnTone(resumo.churnGeralMes)}
            />
            <KpiCard
              icon={<TrendingUp className="w-5 h-5 text-emerald-700" />}
              label="Entradas"
              value={`+${resumo.entradasMes}`}
            />
            <KpiCard
              icon={<TrendingDown className="w-5 h-5 text-rose-700" />}
              label="Saídas"
              value={`-${resumo.saidasMes}`}
            />
            <KpiCard
              icon={<TrendingUp className="w-5 h-5 text-emerald-700" />}
              label="Saldo do mês"
              value={`${resumo.saldoGeralMes > 0 ? '+' : ''}${resumo.saldoGeralMes}`}
              tone={resumo.saldoGeralMes >= 0 ? 'good' : 'bad'}
            />
            <KpiCard
              icon={<BarChart3 className="w-5 h-5 text-yellow-700" />}
              label="Professores verdes"
              value={`${resumo.professoresVerdes}/${resumo.professoresVerdes + resumo.professoresAmarelos + resumo.professoresVermelhos}`}
            />
          </div>
        </section>

        {/* Camada 2: Retenção */}
        <section className="space-y-3" id="retencao">
          <h2 className="text-lg font-semibold text-gray-900">Retenção (3m / 6m / 12m)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <RetentionCard label="Retenção 3m" value={ret3mAtual} />
            <RetentionCard label="Retenção 6m" value={ret6mAtual} />
            <RetentionCard label="Retenção 12m" value={ret12mAtual} />
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlySeries}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                  <Legend />
                  {mediaAnoRef && (
                    <>
                      <ReferenceLine
                        y={mediaAnoRef.ret3m}
                        stroke="#10b981"
                        strokeDasharray="4 4"
                        strokeWidth={1}
                        label={{ value: `Média ${mediaAnoRef.ano} 3m`, position: 'right', fill: '#10b981', fontSize: 10 }}
                      />
                      <ReferenceLine
                        y={mediaAnoRef.ret6m}
                        stroke="#6366f1"
                        strokeDasharray="4 4"
                        strokeWidth={1}
                        label={{ value: `Média ${mediaAnoRef.ano} 6m`, position: 'right', fill: '#6366f1', fontSize: 10 }}
                      />
                      <ReferenceLine
                        y={mediaAnoRef.ret12m}
                        stroke="#f97316"
                        strokeDasharray="4 4"
                        strokeWidth={1}
                        label={{ value: `Média ${mediaAnoRef.ano} 12m`, position: 'right', fill: '#f97316', fontSize: 10 }}
                      />
                    </>
                  )}
                  <Line type="monotone" dataKey="ret3m" name="Ret 3m" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="ret6m" name="Ret 6m" stroke="#6366f1" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="ret12m" name="Ret 12m" stroke="#f97316" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Camada 3: Tendências de base, churn, entradas/saídas */}
        <section className="space-y-3" id="tendencias">
          <h2 className="text-lg font-semibold text-gray-900">Tendências (12 meses)</h2>
          {mediasAnuais.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Médias por ano</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {mediasAnuais.map((m) => (
                  <div key={m.ano} className="p-3 rounded-lg border border-gray-100 bg-gray-50">
                    <p className="text-xs uppercase text-gray-500 mb-1">Ano {m.ano}</p>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-700">
                      <span className="font-semibold">Churn: {m.churn.toFixed(1)}%</span>
                      <span>Ret 3m: {m.ret3m.toFixed(1)}%</span>
                      <span>Ret 6m: {m.ret6m.toFixed(1)}%</span>
                      <span>Ret 12m: {m.ret12m.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Base vs Churn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlySeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip />
                      <Legend />
                      {mediaAnoRef && (
                        <ReferenceLine
                          yAxisId="right"
                          y={mediaAnoRef.churn}
                          stroke="#ef4444"
                          strokeDasharray="4 4"
                          strokeWidth={1}
                          label={{ value: `Média ${mediaAnoRef.ano} churn`, position: 'right', fill: '#ef4444', fontSize: 10 }}
                        />
                      )}
                      <Line yAxisId="left" type="monotone" dataKey="baseFim" name="Base fim" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                      <Line yAxisId="left" type="monotone" dataKey="baseInicio" name="Base início" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                      <Line yAxisId="right" type="monotone" dataKey="churn" name="Churn %" stroke="#ef4444" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Entradas vs Saídas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlySeries}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="entradas" name="Entradas" fill="#22c55e" />
                      <Bar dataKey="saidas" name="Saídas" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Camada 4: Professores em risco */}
        <section className="space-y-3" id="professores">
          <h2 className="text-lg font-semibold text-gray-900">Professores em atenção</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Piores churn (mês)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {piorChurn.map((p) => (
                  <div key={p.nome} className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{p.nome}</p>
                      <p className="text-xs text-gray-500">
                        Ativos: {p.atletasAtivos} • Base início: {p.baseInicioMes}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ${p.churnMensal.valor >= 4 ? 'text-red-600' : 'text-amber-600'}`}>
                      {p.churnMensal.valor.toFixed(1)}%
                    </span>
                  </div>
                ))}
                {piorChurn.length === 0 && <p className="text-sm text-gray-500">Sem dados.</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Piores retenções (6m)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {piorRetencao.map((p) => (
                  <div key={p.nome} className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{p.nome}</p>
                      <p className="text-xs text-gray-500">
                        Ret 12m: {p.retencaoAnual.valor.toFixed(0)}%
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ${p.retencaoSemestral.valor < 75 ? 'text-red-600' : 'text-orange-600'}`}>
                      {p.retencaoSemestral.valor.toFixed(0)}%
                    </span>
                  </div>
                ))}
                {piorRetencao.length === 0 && <p className="text-sm text-gray-500">Sem dados.</p>}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Camada 5: Alertas */}
        <section className="space-y-3" id="alertas">
          <h2 className="text-lg font-semibold text-gray-900">Alertas rápidos</h2>
          <Card>
            <CardContent className="space-y-2 py-4">
              {professores
                .filter((p) => p.statusGeral === 'vermelho' || p.churnMensal.valor >= 4 || p.retencaoSemestral.valor < 75)
                .map((p) => (
                  <div key={p.nome} className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded px-3 py-2">
                    <AlertTriangle className="w-4 h-4" />
                    <span>
                      {p.nome}: churn {p.churnMensal.valor.toFixed(1)}%, ret 6m {p.retencaoSemestral.valor.toFixed(0)}%, base fim {p.baseFimMes}
                    </span>
                  </div>
                ))}
              {professores.filter((p) => p.statusGeral === 'vermelho' || p.churnMensal.valor >= 4 || p.retencaoSemestral.valor < 75).length === 0 && (
                <p className="text-sm text-gray-500">Sem alertas críticos no mês.</p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  tone?: 'good' | 'warn' | 'bad';
}) {
  const toneClasses =
    tone === 'good'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
      : tone === 'warn'
        ? 'bg-amber-50 text-amber-700 border-amber-100'
        : tone === 'bad'
          ? 'bg-red-50 text-red-700 border-red-100'
          : 'bg-white text-gray-900 border-gray-200';

  return (
    <Card className={tone ? `border ${toneClasses}` : ''}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">{icon}</div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RetentionCard({ label, value }: { label: string; value: number }) {
  const tone = getRetentionTone(label, value);
  return (
    <Card className={tone.card}>
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={tone.iconBg}>
            <CircleDot className={tone.icon} />
          </div>
          <div>
            <p className="text-xs uppercase text-gray-500">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value.toFixed(1)}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getChurnTone(churn: number): 'good' | 'warn' | 'bad' | undefined {
  if (churn <= 2) return 'good';
  if (churn <= 4) return 'warn';
  return 'bad';
}

function getRetentionTone(label: string, valor: number) {
  const thresholds =
    label.includes('3') ? { good: 90 } : label.includes('6') ? { good: 80 } : { good: 75 };
  const good = thresholds.good;
  const warn = good - 5;

  if (valor >= good) {
    return { card: 'border border-emerald-100 bg-emerald-50', iconBg: 'p-2 bg-white rounded-lg border border-emerald-100', icon: 'w-5 h-5 text-emerald-700' };
  }
  if (valor >= warn) {
    return { card: 'border border-amber-100 bg-amber-50', iconBg: 'p-2 bg-white rounded-lg border border-amber-100', icon: 'w-5 h-5 text-amber-700' };
  }
  return { card: 'border border-red-100 bg-red-50', iconBg: 'p-2 bg-white rounded-lg border border-red-100', icon: 'w-5 h-5 text-red-700' };
}

function filtrarAtletasPorTipo(atletas: Atleta[], tipo: 'corrida' | 'forca' | 'geral'): Atleta[] {
  if (tipo === 'corrida') {
    return atletas.filter((a) => !isTreinadorExcluido(a.treinador));
  }
  if (tipo === 'forca') {
    return atletas.filter(
      (a) =>
        a.treinadorForca &&
        a.treinadorForca.trim() !== '' &&
        a.treinadorForca.toLowerCase() !== 'ninguém' &&
        a.treinadorForca.toLowerCase() !== 'ninguem' &&
        !isTreinadorExcluido(a.treinadorForca)
    );
  }
  return atletas.filter((a) => {
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

function calcularRetencaoGeral(atletas: Atleta[], dataRef: Date, meses: number): number {
  const fimMes = endOfMonth(dataRef);
  const elegiveis = atletas.filter((a) => differenceInMonths(fimMes, a.dataEntrada) >= meses);
  if (elegiveis.length === 0) return 100;

  const retidos = elegiveis.filter((a) => {
    const mesesDesdeEntrada = differenceInMonths(fimMes, a.dataEntrada);
    if (mesesDesdeEntrada < meses) return false;
    // Ativo: conta se não saiu até fim do mês
    if (a.status === 'Ativo') {
      return !a.dataSaida || a.dataSaida > fimMes;
    }
    // Inativo: conta se ficou pelo menos X meses antes de sair
    if (a.dataSaida) {
      return differenceInMonths(a.dataSaida, a.dataEntrada) >= meses;
    }
    return false;
  });

  return (retidos.length / elegiveis.length) * 100;
}

function construirSerieMensal(atletas: Atleta[], mesRef: Date, tipo: 'corrida' | 'forca' | 'geral'): MonthlyPoint[] {
  if (atletas.length === 0) return [];
  const inicio = startOfMonth(subMonths(mesRef, 11));
  const pontos: MonthlyPoint[] = [];

  for (let i = 0; i < 12; i++) {
    const ref = addMonths(inicio, i);
    const profs =
      tipo === 'corrida'
        ? calcularTodasMetricas(atletas, ref)
        : tipo === 'forca'
          ? calcularMetricasForca(atletas, ref)
          : calcularMetricasGeral(atletas, ref);
    const resumo = calcularResumoGeral(atletas, profs, ref, tipo);
    pontos.push({
      label: format(ref, "MMM yy", { locale: ptBR }),
      date: ref,
      year: ref.getFullYear(),
      churn: Number(resumo.churnGeralMes.toFixed(2)),
      saldo: resumo.saldoGeralMes,
      baseInicio: resumo.baseInicioMes,
      baseFim: resumo.baseFimMes,
      entradas: resumo.entradasMes,
      saidas: resumo.saidasMes,
      ret3m: Number(calcularRetencaoGeral(atletas, ref, 3).toFixed(1)),
      ret6m: Number(calcularRetencaoGeral(atletas, ref, 6).toFixed(1)),
      ret12m: Number(calcularRetencaoGeral(atletas, ref, 12).toFixed(1)),
    });
  }

  return pontos;
}

function calcularMediasAnuais(pontos: MonthlyPoint[]) {
  const agregados = new Map<number, { churn: number; ret3m: number; ret6m: number; ret12m: number; count: number }>();
  pontos.forEach((p) => {
    if (p.year < 2024) return;
    const atual = agregados.get(p.year) ?? { churn: 0, ret3m: 0, ret6m: 0, ret12m: 0, count: 0 };
    agregados.set(p.year, {
      churn: atual.churn + p.churn,
      ret3m: atual.ret3m + p.ret3m,
      ret6m: atual.ret6m + p.ret6m,
      ret12m: atual.ret12m + p.ret12m,
      count: atual.count + 1,
    });
  });

  return Array.from(agregados.entries())
    .map(([ano, valores]) => ({
      ano,
      churn: valores.churn / valores.count,
      ret3m: valores.ret3m / valores.count,
      ret6m: valores.ret6m / valores.count,
      ret12m: valores.ret12m / valores.count,
    }))
    .sort((a, b) => a.ano - b.ano);
}
