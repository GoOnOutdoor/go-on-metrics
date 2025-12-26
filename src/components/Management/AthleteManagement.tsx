import { useMemo, useState } from 'react';
import type { Atleta } from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { differenceInMonths } from 'date-fns';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, ArrowLeft, Edit3, ShieldX, Undo2 } from 'lucide-react';

interface Props {
  atletas: Atleta[];
  onSave: (lista: Atleta[]) => void;
  onBack: () => void;
}

type StatusFiltro = 'todos' | 'Ativo' | 'Inativo';

interface FormState {
  id?: string;
  nome: string;
  treinador: string;
  treinadorForca: string;
  status: 'Ativo' | 'Inativo';
  dataEntrada: string;
  dataSaida: string;
  plano: string;
}

export function AthleteManagement({ atletas, onSave, onBack }: Props) {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<StatusFiltro>('todos');
  const [form, setForm] = useState<FormState | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const listaFiltrada = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return atletas
      .filter((a) => {
        if (filtroStatus !== 'todos' && a.status !== filtroStatus) return false;
        if (!termo) return true;
        return (
          a.nome.toLowerCase().includes(termo) ||
          a.treinador.toLowerCase().includes(termo) ||
          (a.treinadorForca || '').toLowerCase().includes(termo)
        );
      })
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [atletas, busca, filtroStatus]);

  const abrirNovo = () => {
    setErro(null);
    setForm({
      nome: '',
      treinador: '',
      treinadorForca: '',
      status: 'Ativo',
      dataEntrada: '',
      dataSaida: '',
      plano: '',
    });
  };

  const abrirEdicao = (atleta: Atleta) => {
    setErro(null);
    setForm({
      id: atleta.id,
      nome: atleta.nome,
      treinador: atleta.treinador,
      treinadorForca: atleta.treinadorForca || '',
      status: atleta.status,
      dataEntrada: toInputDate(atleta.dataEntrada),
      dataSaida: atleta.dataSaida ? toInputDate(atleta.dataSaida) : '',
      plano: atleta.plano || '',
    });
  };

  const cancelarForm = () => {
    setForm(null);
    setErro(null);
  };

  const handleSubmit = () => {
    if (!form) return;
    const { valido, mensagem, atleta } = montarAtleta(form);
    if (!valido || !atleta) {
      setErro(mensagem || 'Erro ao salvar atleta');
      return;
    }

    const listaAtualizada = form.id
      ? atletas.map((a) => (a.id === form.id ? atleta : a))
      : [...atletas, atleta];

    onSave(listaAtualizada);
    setForm(null);
  };

  const toggleStatus = (alvo: Atleta) => {
    const novoStatus = alvo.status === 'Ativo' ? 'Inativo' : 'Ativo';
    const hoje = new Date();
    const dataSaida = novoStatus === 'Inativo' ? hoje : null;
    const atualizado = recalcularAtleta({
      ...alvo,
      status: novoStatus,
      dataSaida,
    });
    const listaAtualizada = atletas.map((a) =>
      a.id === alvo.id ? atualizado : a
    );
    onSave(listaAtualizada);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gestão de atletas</h1>
              <p className="text-sm text-gray-500">Adicionar, editar, inativar ou trocar treinador</p>
            </div>
          </div>
          <Button onClick={abrirNovo}>
            <Plus className="w-4 h-4 mr-2" />
            Novo atleta
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Lista de atletas ({listaFiltrada.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-3 md:items-center">
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome ou treinador..."
                className="flex-1 h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value as StatusFiltro)}
                className="w-40 h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="todos">Todos os status</option>
                <option value="Ativo">Ativos</option>
                <option value="Inativo">Inativos</option>
              </select>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 font-semibold text-gray-700">Nome</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-700">Treinador</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-700">Treinador força</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-700">Status</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-700">Entrada</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-700">Saída</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-700">Plano</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-700">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {listaFiltrada.map((atleta) => (
                    <tr key={atleta.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2">{atleta.nome}</td>
                      <td className="px-3 py-2 text-gray-700">{atleta.treinador || '-'}</td>
                      <td className="px-3 py-2 text-gray-700">{atleta.treinadorForca || '-'}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${atleta.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                          {atleta.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {format(atleta.dataEntrada, 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {atleta.dataSaida ? format(atleta.dataSaida, 'dd/MM/yyyy', { locale: ptBR }) : '—'}
                      </td>
                      <td className="px-3 py-2 text-gray-600">{atleta.plano || '-'}</td>
                      <td className="px-3 py-2">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => abrirEdicao(atleta)}>
                            <Edit3 className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant={atleta.status === 'Ativo' ? 'outline' : 'secondary'}
                            onClick={() => toggleStatus(atleta)}
                          >
                            {atleta.status === 'Ativo' ? (
                              <>
                                <ShieldX className="w-4 h-4 mr-1" />
                                Inativar
                              </>
                            ) : (
                              <>
                                <Undo2 className="w-4 h-4 mr-1" />
                                Reativar
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {listaFiltrada.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 py-6 text-center text-gray-500">
                        Nenhum atleta encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {form && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-40 px-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {form.id ? 'Editar atleta' : 'Novo atleta'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Preencha nome, treinador, status e datas
                  </p>
                </div>
                <Button variant="ghost" onClick={cancelarForm}>
                  Cancelar
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Campo label="Nome" required>
                  <input
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </Campo>
                <Campo label="Plano">
                  <input
                    value={form.plano}
                    onChange={(e) => setForm({ ...form, plano: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </Campo>
                <Campo label="Treinador (corrida)" required>
                  <input
                    value={form.treinador}
                    onChange={(e) => setForm({ ...form, treinador: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </Campo>
                <Campo label="Treinador de força">
                  <input
                    value={form.treinadorForca}
                    onChange={(e) => setForm({ ...form, treinadorForca: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </Campo>
                <Campo label="Status" required>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as 'Ativo' | 'Inativo' })
                    }
                    className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </Campo>
                <Campo label="Data de entrada" required>
                  <input
                    type="date"
                    value={form.dataEntrada}
                    onChange={(e) => setForm({ ...form, dataEntrada: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </Campo>
                <Campo label="Data de saída (se inativo)" required={form.status === 'Inativo'}>
                  <input
                    type="date"
                    value={form.dataSaida}
                    onChange={(e) => setForm({ ...form, dataSaida: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </Campo>
              </div>

              {erro && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">
                  {erro}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={cancelarForm}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>
                  Salvar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Campo({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="space-y-1 text-sm text-gray-700">
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {required && <span className="text-red-500">*</span>}
      </div>
      {children}
    </label>
  );
}

function montarAtleta(form: FormState): { valido: boolean; mensagem?: string; atleta?: Atleta } {
  if (!form.nome.trim()) return { valido: false, mensagem: 'Nome é obrigatório' };
  if (!form.treinador.trim()) return { valido: false, mensagem: 'Treinador é obrigatório' };
  if (!form.dataEntrada) return { valido: false, mensagem: 'Data de entrada é obrigatória' };

  const dataEntrada = parseDate(form.dataEntrada);
  const dataSaida = form.dataSaida ? parseDate(form.dataSaida) : null;

  if (!dataEntrada) return { valido: false, mensagem: 'Data de entrada inválida' };
  if (form.status === 'Inativo' && !dataSaida) {
    return { valido: false, mensagem: 'Data de saída é obrigatória para inativos' };
  }
  if (dataSaida && dataSaida < dataEntrada) {
    return { valido: false, mensagem: 'Data de saída não pode ser antes da entrada' };
  }

  const atleta: Atleta = recalcularAtleta({
    id: form.id || crypto.randomUUID(),
    nome: form.nome.trim(),
    treinador: form.treinador.trim(),
    treinadorForca: form.treinadorForca.trim() ? form.treinadorForca.trim() : null,
    status: form.status,
    dataEntrada,
    dataSaida,
    plano: form.plano.trim() || null,
    tempoMeses: 0,
    tempoAteChurn: null,
  });

  return { valido: true, atleta };
}

function parseDate(valor: string): Date | null {
  const d = new Date(valor);
  return isNaN(d.getTime()) ? null : d;
}

function toInputDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function recalcularAtleta(atleta: Atleta): Atleta {
  const hoje = new Date();
  const dataEntrada = new Date(atleta.dataEntrada);
  const dataSaida = atleta.dataSaida ? new Date(atleta.dataSaida) : null;
  const dataFim = atleta.status === 'Inativo' && dataSaida ? dataSaida : hoje;
  const tempoMeses = Math.max(0, differenceInMonths(dataFim, dataEntrada));
  const tempoAteChurn =
    atleta.status === 'Inativo' && dataSaida
      ? differenceInMonths(dataSaida, dataEntrada)
      : null;

  return {
    ...atleta,
    dataEntrada,
    dataSaida,
    tempoMeses,
    tempoAteChurn,
  };
}
