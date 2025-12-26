import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  mesReferencia: Date;
  onMesChange: (novoMes: Date) => void;
}

export function MonthSelector({ mesReferencia, onMesChange }: Props) {
  const handlePrevious = () => {
    onMesChange(subMonths(mesReferencia, 1));
  };

  const handleNext = () => {
    const proximo = addMonths(mesReferencia, 1);
    // Não permitir avançar além do mês atual
    if (proximo <= new Date()) {
      onMesChange(proximo);
    }
  };

  const mesFormatado = format(mesReferencia, "MMMM 'de' yyyy", { locale: ptBR });
  const podeAvancar = addMonths(mesReferencia, 1) <= new Date();

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrevious}
        className="h-8 w-8"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="min-w-[160px] text-center font-medium text-gray-700 capitalize">
        {mesFormatado}
      </span>

      <Button
        variant="outline"
        size="icon"
        onClick={handleNext}
        disabled={!podeAvancar}
        className="h-8 w-8"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
