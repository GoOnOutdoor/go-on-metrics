import type { MetricasProfessor } from '../../types';
import { ProfessorCard } from './ProfessorCard';

interface Props {
  professores: MetricasProfessor[];
  onSelectProfessor: (professor: MetricasProfessor) => void;
}

export function ProfessorGrid({ professores, onSelectProfessor }: Props) {
  if (professores.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        Nenhum professor encontrado
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {professores.map((professor) => (
        <ProfessorCard
          key={professor.nome}
          professor={professor}
          onClick={() => onSelectProfessor(professor)}
        />
      ))}
    </div>
  );
}
