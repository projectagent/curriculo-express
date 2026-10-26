import React from 'react';
import { Link } from 'react-router-dom';
import { FileTextIcon } from '../common/Icons';

interface EmptyStateProps {
  hasFilters: boolean;
  onClearFilters?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ hasFilters, onClearFilters }) => {
  return (
    <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-200 my-4 shadow-2xs">
      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
        <FileTextIcon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-bold text-navy-900 mb-1">
        Nenhum lead encontrado
      </h3>
      <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4 leading-relaxed">
        {hasFilters
          ? 'Nenhum resultado corresponde aos filtros selecionados.'
          : 'Ainda não há solicitações de revisão express cadastradas.'}
      </p>

      {hasFilters ? (
        onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-xs font-semibold text-navy-700 hover:text-navy-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
          >
            Limpar filtros
          </button>
        )
      ) : (
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-navy-900 hover:bg-navy-800 px-3.5 py-2 rounded-lg transition-colors shadow-xs"
        >
          Acessar Landing Page
        </Link>
      )}
    </div>
  );
};
