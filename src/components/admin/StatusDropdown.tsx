import React, { useState } from 'react';
import { LeadStatus, LEAD_STATUS_VALUES } from '../../types/lead';

interface StatusDropdownProps {
  currentStatus: LeadStatus;
  leadId: string;
  leadName?: string;
  onStatusChange: (newStatus: LeadStatus) => Promise<boolean>;
}

export const StatusDropdown: React.FC<StatusDropdownProps> = ({
  currentStatus,
  leadName,
  onStatusChange,
}) => {
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value as LeadStatus;
    if (selected === currentStatus) return;

    setIsUpdating(true);
    try {
      await onStatusChange(selected);
    } finally {
      setIsUpdating(false);
    }
  };

  const getSelectBorderColor = () => {
    switch (currentStatus) {
      case 'Novo':
        return 'border-sky-300 text-sky-800 bg-sky-50/70';
      case 'Aguardando Pagamento':
        return 'border-amber-300 text-amber-800 bg-amber-50/70';
      case 'Revisando (IA)':
        return 'border-purple-300 text-purple-800 bg-purple-50/70';
      case 'Entregue':
        return 'border-emerald-300 text-emerald-800 bg-emerald-50/70';
      default:
        return 'border-slate-300 text-slate-700 bg-white';
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <select
        value={currentStatus}
        onChange={handleChange}
        disabled={isUpdating}
        aria-label={`Alterar status do lead ${leadName || ''}`.trim()}
        className={`text-xs font-semibold py-1 px-2.5 rounded-lg border transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-navy-600 disabled:opacity-50 ${getSelectBorderColor()}`}
      >
        {LEAD_STATUS_VALUES.map((status) => (
          <option key={status} value={status} className="bg-white text-slate-800 py-1">
            {status}
          </option>
        ))}
      </select>
      {isUpdating && (
        <span className="absolute right-1 w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin pointer-events-none" />
      )}
    </div>
  );
};
