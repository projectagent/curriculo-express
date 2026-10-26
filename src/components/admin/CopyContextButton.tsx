import React from 'react';
import { Lead } from '../../types/lead';
import { CopyIcon, CheckIcon } from '../common/Icons';

interface CopyContextButtonProps {
  lead: Lead;
  isCopied: boolean;
  onCopy: (lead: Lead) => Promise<boolean>;
}

export const CopyContextButton: React.FC<CopyContextButtonProps> = ({
  lead,
  isCopied,
  onCopy,
}) => {
  return (
    <button
      type="button"
      onClick={() => onCopy(lead)}
      title="Copiar prompt completo para ChatGPT"
      aria-label={`Copiar Contexto de ${lead.name}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-navy-600 ${
        isCopied
          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-300'
          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-navy-900 shadow-2xs'
      }`}
    >
      {isCopied ? (
        <>
          <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
          <span>Copiado!</span>
        </>
      ) : (
        <>
          <CopyIcon className="w-3.5 h-3.5 text-slate-500" />
          <span>Copiar Contexto</span>
        </>
      )}
    </button>
  );
};
