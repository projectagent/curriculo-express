import React from 'react';
import { AdminStats, LeadStatus } from '../../types/lead';

interface AdminStatsCardsProps {
  stats: AdminStats;
  selectedStatus?: LeadStatus | 'Todos';
  onSelectStatus?: (status: LeadStatus | 'Todos') => void;
}

export const AdminStatsCards: React.FC<AdminStatsCardsProps> = ({
  stats,
  selectedStatus,
  onSelectStatus,
}) => {
  const cards: {
    label: string;
    count: number;
    statusFilter: LeadStatus | 'Todos';
    colorClasses: string;
    indicatorColor: string;
  }[] = [
    {
      label: 'Total de Leads',
      count: stats.total,
      statusFilter: 'Todos',
      colorClasses: 'border-slate-200 bg-white hover:border-slate-300',
      indicatorColor: 'bg-slate-400',
    },
    {
      label: 'Novos',
      count: stats.novos,
      statusFilter: 'Novo',
      colorClasses: 'border-sky-200 bg-sky-50/50 hover:border-sky-300',
      indicatorColor: 'bg-sky-500',
    },
    {
      label: 'Aguardando Pagamento',
      count: stats.aguardandoPagamento,
      statusFilter: 'Aguardando Pagamento',
      colorClasses: 'border-amber-200 bg-amber-50/50 hover:border-amber-300',
      indicatorColor: 'bg-amber-500',
    },
    {
      label: 'Revisando (IA)',
      count: stats.revisandoIA,
      statusFilter: 'Revisando (IA)',
      colorClasses: 'border-purple-200 bg-purple-50/50 hover:border-purple-300',
      indicatorColor: 'bg-purple-500',
    },
    {
      label: 'Entregues',
      count: stats.entregues,
      statusFilter: 'Entregue',
      colorClasses: 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-300',
      indicatorColor: 'bg-emerald-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 my-6">
      {cards.map((card) => {
        const isSelected = selectedStatus === card.statusFilter;

        return (
          <button
            key={card.label}
            type="button"
            onClick={() => onSelectStatus?.(card.statusFilter)}
            className={`p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer shadow-xs ${
              card.colorClasses
            } ${isSelected ? 'ring-2 ring-navy-700 shadow-sm' : ''}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-500 truncate">
                {card.label}
              </span>
              <span className={`w-2 h-2 rounded-full ${card.indicatorColor}`} />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              {card.count}
            </div>
          </button>
        );
      })}
    </div>
  );
};
