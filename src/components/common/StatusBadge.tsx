import React from 'react';
import { LeadStatus } from '../../types/lead';

interface StatusBadgeProps {
  status: LeadStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1 font-medium';

  const getStyle = () => {
    switch (status) {
      case 'Novo':
        return 'bg-status-novo-bg text-status-novo-text border-status-novo-border';
      case 'Aguardando Pagamento':
        return 'bg-status-pagamento-bg text-status-pagamento-text border-status-pagamento-border';
      case 'Revisando (IA)':
        return 'bg-status-revisando-bg text-status-revisando-text border-status-revisando-border';
      case 'Entregue':
        return 'bg-status-entregue-bg text-status-entregue-text border-status-entregue-border';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getDotColor = () => {
    switch (status) {
      case 'Novo':
        return 'bg-sky-500';
      case 'Aguardando Pagamento':
        return 'bg-amber-500';
      case 'Revisando (IA)':
        return 'bg-purple-500';
      case 'Entregue':
        return 'bg-emerald-500';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-xs tracking-wide whitespace-nowrap ${getStyle()} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${getDotColor()}`} />
      {status}
    </span>
  );
};
