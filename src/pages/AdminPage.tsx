import React, { useState } from 'react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { AdminHeader } from '../components/admin/AdminHeader';
import { AdminStatsCards } from '../components/admin/AdminStatsCards';
import { TableFilters } from '../components/admin/TableFilters';
import { LeadsTable } from '../components/admin/LeadsTable';
import { AdminLogin, ADMIN_AUTH_SESSION_KEY } from '../components/admin/AdminLogin';
import { useLeads } from '../hooks/useLeads';
import { useClipboard } from '../hooks/useClipboard';

export interface AdminPageProps {
  initialAuthenticated?: boolean;
}

export const AdminPage: React.FC<AdminPageProps> = ({ initialAuthenticated }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof initialAuthenticated === 'boolean') {
      return initialAuthenticated;
    }
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage.getItem(ADMIN_AUTH_SESSION_KEY) === 'true';
    }
    return false;
  });

  const {
    leads,
    allLeads,
    stats,
    isLoading,
    filters,
    setFilters,
    updateStatus,
    deleteLead,
    refresh,
  } = useLeads();

  const { copiedLeadId, copyLeadPrompt } = useClipboard();

  const handleLogout = () => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(ADMIN_AUTH_SESSION_KEY);
      }
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
  };

  const hasFilters = Boolean(
    (filters.searchQuery && filters.searchQuery.trim().length > 0) ||
      (filters.status && filters.status !== 'Todos')
  );

  const handleClearFilters = () => {
    setFilters({
      ...filters,
      searchQuery: '',
      status: 'Todos',
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {!isAuthenticated ? (
            <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />
          ) : (
            <>
              {/* Header */}
              <AdminHeader onRefresh={refresh} isLoading={isLoading} onLogout={handleLogout} />

              {/* Stats Summary Cards (Clickable filter) */}
              <AdminStatsCards
                stats={stats}
                selectedStatus={filters.status}
                onSelectStatus={(st) => setFilters({ ...filters, status: st })}
              />

              {/* Search & Filter Toolbar */}
              {(allLeads.length > 0 || hasFilters) && (
                <TableFilters
                  filters={filters}
                  onFilterChange={setFilters}
                  totalFiltered={leads.length}
                />
              )}

              {/* Leads Data Table */}
              <LeadsTable
                leads={leads}
                isLoading={isLoading}
                copiedLeadId={copiedLeadId}
                hasFilters={hasFilters}
                onStatusChange={updateStatus}
                onCopyContext={copyLeadPrompt}
                onDeleteLead={deleteLead}
                onClearFilters={handleClearFilters}
              />
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};
