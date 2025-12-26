import { cn } from '../../lib/utils';
import type { TipoAba } from '../../types';

interface Props {
  activeTab: TipoAba;
  onTabChange: (tab: TipoAba) => void;
}

export function TabNavigation({ activeTab, onTabChange }: Props) {
  const tabs: { id: TipoAba; label: string }[] = [
    { id: 'geral', label: 'Geral' },
    { id: 'corrida', label: 'Corrida' },
    { id: 'forca', label: 'Força' },
  ];

  return (
    <nav className="flex border-b border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
            activeTab === tab.id
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          )}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
