import React from 'react';
import { Lead, LeadStatus } from '../../types/lead';
import { LeadTableRow } from './LeadTableRow';
import { EmptyState } from './EmptyState';

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  copiedLeadId: string | null;
  hasFilters: boolean;
  onStatusChange: (id: string, newStatus: LeadStatus) => Promise<boolean>;
  onCopyContext: (lead: Lead) => Promise<boolean>;
  onDeleteLead: (id: string) => Promise<boolean>;
  onClearFilters: () => void;
}

export const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  isLoading,
  copiedLeadId,
  hasFilters,
  onStatusChange,
  onCopyContext,
  onDeleteLead,
  onClearFilters,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="w-8 h-8 border-3 border-navy-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-medium text-slate-500">Carregando leads cadastrados...</p>
      </div>
    );
  }

  if (leads.length === 0) {
    return <EmptyState hasFilters={hasFilters} onClearFilters={onClearFilters} />;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {/* 5 Mandatory Columns */}
              <th scope="col" className="py-3 px-4 whitespace-nowrap">
                Data/Hora
              </th>
              <th scope="col" className="py-3 px-4 whitespace-nowrap">
                Nome
              </th>
              <th scope="col" className="py-3 px-4 whitespace-nowrap">
                Link (LinkedIn / CV)
              </th>
              <th scope="col" className="py-3 px-4 whitespace-nowrap">
                Área / Cargo
              </th>
              <th scope="col" className="py-3 px-4 whitespace-nowrap">
                Status
              </th>
              <th scope="col" className="py-3 px-4 text-right whitespace-nowrap">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {leads.map((lead) => (
              <LeadTableRow
                key={lead.id}
                lead={lead}
                isCopied={copiedLeadId === lead.id}
                onStatusChange={(newStatus) => onStatusChange(lead.id, newStatus)}
                onCopyContext={onCopyContext}
                onDeleteLead={onDeleteLead}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
