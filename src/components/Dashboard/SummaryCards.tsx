import type { ResumoGeral } from '../../types';
import { Card, CardContent } from '../ui/card';
import { Users, TrendingDown, TrendingUp, Award, LogIn, LogOut } from 'lucide-react';

interface Props {
  resumo: ResumoGeral;
}

export function SummaryCards({ resumo }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-8 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{resumo.totalAtivos}</p>
              <p className="text-sm text-gray-500">Ativos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{resumo.churnGeralMes.toFixed(1)}%</p>
              <p className="text-sm text-gray-500">Churn</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Users className="w-5 h-5 text-gray-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{resumo.baseInicioMes}</p>
              <p className="text-sm text-gray-500">Base início</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Users className="w-5 h-5 text-gray-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{resumo.baseFimMes}</p>
              <p className="text-sm text-gray-500">Base fim</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <LogIn className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                +{resumo.entradasMes}
              </p>
              <p className="text-sm text-gray-500">Entradas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-lg">
              <LogOut className="w-5 h-5 text-rose-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                -{resumo.saidasMes}
              </p>
              <p className="text-sm text-gray-500">Saídas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${resumo.saldoGeralMes >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <TrendingUp className={`w-5 h-5 ${resumo.saldoGeralMes >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {resumo.saldoGeralMes > 0 ? '+' : ''}{resumo.saldoGeralMes}
              </p>
              <p className="text-sm text-gray-500">Saldo</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {resumo.professoresVerdes}/{resumo.professoresVerdes + resumo.professoresAmarelos + resumo.professoresVermelhos}
              </p>
              <p className="text-sm text-gray-500">Verdes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
