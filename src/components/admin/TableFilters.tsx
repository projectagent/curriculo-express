import React from 'react';
import { LeadFilters, LeadStatus, LEAD_STATUS_VALUES } from '../../types/lead';
import { SearchIcon } from '../common/Icons';

interface TableFiltersProps {
  filters: LeadFilters;
  onFilterChange: (updated: LeadFilters) => void;
  totalFiltered: number;
}

export const TableFilters: React.FC<TableFiltersProps> = ({
  filters,
  onFilterChange,
  totalFiltered,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
      {/* Search Bar */}
      <div className="relative flex-1 max-w-md">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar por nome, cargo ou link..."
          value={filters.searchQuery || ''}
          onChange={(e) =>
            onFilterChange({ ...filters, searchQuery: e.target.value })
          }
          className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-navy-100 focus:border-navy-700"
        />
        {filters.searchQuery && (
          <button
            onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Status Filter & Counter */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Status:
          </label>
          <select
            id="status-filter"
            value={filters.status || 'Todos'}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                status: e.target.value as LeadStatus | 'Todos',
              })
            }
            className="text-xs sm:text-sm py-2 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-100 focus:border-navy-700 font-medium"
          >
            <option value="Todos">Todos os Status</option>
            {LEAD_STATUS_VALUES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-500 whitespace-nowrap bg-slate-100 px-2.5 py-2 rounded-lg font-medium border border-slate-200">
          {totalFiltered} {totalFiltered === 1 ? 'resultado' : 'resultados'}
        </span>
      </div>
    </div>
  );
};
