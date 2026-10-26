import React from 'react';
import { Link } from 'react-router-dom';
import { RefreshIcon } from '../common/Icons';

interface AdminHeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  onLogout?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({ onRefresh, isLoading, onLogout }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Painel Operacional de Leads
          </h1>
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200"
            title="Conectado à API Local (SQLite)"
          >
            <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-emerald-500" />
            API Local (SQLite)
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Gerenciamento de solicitações de revisão, transição de status e aceleração de prompts com IA.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs focus:outline-none"
          title="Recarregar leads"
        >
          <RefreshIcon className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-navy-700' : ''}`} />
          <span>Atualizar</span>
        </button>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-navy-900 text-white hover:bg-navy-800 transition-colors shadow-sm"
        >
          <span>Ir para a Landing Page</span>
          <span aria-hidden="true">→</span>
        </Link>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-rose-600 hover:bg-rose-50 hover:border-rose-300 transition-colors shadow-2xs"
            title="Sair do painel administrativo"
          >
            Sair
          </button>
        )}
      </div>
    </div>
  );
};
