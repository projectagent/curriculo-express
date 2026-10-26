import React from 'react';
import { Lead, LeadStatus } from '../../types/lead';
import { formatDateTime, truncateText } from '../../utils/formatters';
import { ExternalLinkIcon } from '../common/Icons';
import { StatusDropdown } from './StatusDropdown';
import { CopyContextButton } from './CopyContextButton';
import { DeleteLeadButton } from './DeleteLeadButton';

interface LeadTableRowProps {
  lead: Lead;
  isCopied: boolean;
  onStatusChange: (newStatus: LeadStatus) => Promise<boolean>;
  onCopyContext: (lead: Lead) => Promise<boolean>;
  onDeleteLead: (id: string) => Promise<boolean>;
}

export const LeadTableRow: React.FC<LeadTableRowProps> = ({
  lead,
  isCopied,
  onStatusChange,
  onCopyContext,
  onDeleteLead,
}) => {
  return (
    <tr className="border-b border-slate-200/80 hover:bg-slate-50/70 transition-colors">
      {/* 1. Data/Hora */}
      <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
        {formatDateTime(lead.createdAt)}
      </td>

      {/* 2. Nome */}
      <td className="py-3.5 px-4 text-sm font-bold text-navy-900 whitespace-nowrap">
        <div className="flex flex-col">
          <span>{lead.name}</span>
          {lead.phone && (
            <span className="text-[11px] font-normal text-slate-400">
              {lead.phone}
            </span>
          )}
        </div>
      </td>

      {/* 3. Link (LinkedIn/CV) - Clickable external */}
      <td className="py-3.5 px-4 text-xs whitespace-nowrap">
        <a
          href={lead.link}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Acessar link externo: ${lead.link}`}
          className="inline-flex items-center gap-1.5 text-navy-700 hover:text-whatsapp-dark font-medium underline decoration-slate-300 underline-offset-2 hover:decoration-whatsapp transition-colors max-w-[200px] truncate"
          title={lead.link}
        >
          <ExternalLinkIcon className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{truncateText(lead.link, 28)}</span>
        </a>
      </td>

      {/* 4. Área/Cargo */}
      <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
        <span className="inline-block max-w-[240px] truncate" title={lead.areaRole}>
          {lead.areaRole}
        </span>
      </td>

      {/* 5. Status Dropdown */}
      <td className="py-3.5 px-4 whitespace-nowrap">
        <StatusDropdown
          currentStatus={lead.status}
          leadId={lead.id}
          leadName={lead.name}
          onStatusChange={onStatusChange}
        />
      </td>

      {/* Actions: Copiar Contexto & Excluir */}
      <td className="py-3.5 px-4 text-right whitespace-nowrap">
        <div className="inline-flex items-center justify-end gap-2">
          <CopyContextButton
            lead={lead}
            isCopied={isCopied}
            onCopy={onCopyContext}
          />
          <DeleteLeadButton
            lead={lead}
            onDelete={onDeleteLead}
          />
        </div>
      </td>
    </tr>
  );
};
