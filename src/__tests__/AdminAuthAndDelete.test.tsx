import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminPage } from '../pages/AdminPage';
import { ADMIN_AUTH_SESSION_KEY } from '../components/admin/AdminLogin';
import { setRepositoryInstanceForTesting } from '../services/storage/storageFactory';
import { LocalStorageRepository } from '../services/storage/LocalStorageRepository';

describe('Admin Authentication and Lead Deletion Features', () => {
  let repo: LocalStorageRepository;

  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    repo = new LocalStorageRepository();
    setRepositoryInstanceForTesting(repo);
    vi.restoreAllMocks();
  });

  const renderComponent = (initialAuth?: boolean) =>
    render(
      <BrowserRouter>
        <AdminPage initialAuthenticated={initialAuth} />
      </BrowserRouter>
    );

  describe('Feature 1: Simple Admin Authentication (/admin access gate)', () => {
    it('blocks access and displays login screen when not authenticated', () => {
      renderComponent(false);

      expect(screen.getByText('Acesso Restrito')).toBeInTheDocument();
      expect(
        screen.getByLabelText(/Senha de Administrador/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Acessar Painel/i })
      ).toBeInTheDocument();

      // Data table must NOT be visible
      expect(screen.queryByRole('columnheader', { name: /Data\/Hora/i })).not.toBeInTheDocument();
      expect(screen.queryByText('Mariana Souza')).not.toBeInTheDocument();
    });

    it('rejects incorrect password with clear error feedback', async () => {
      renderComponent(false);

      const passwordInput = screen.getByLabelText(/Senha de Administrador/i);
      const submitBtn = screen.getByRole('button', { name: /Acessar Painel/i });

      fireEvent.change(passwordInput, { target: { value: 'wrong-pass' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/Senha incorreta. Verifique e tente novamente./i)
        ).toBeInTheDocument();
      });

      // Table still not accessible
      expect(screen.queryByRole('columnheader', { name: /Data\/Hora/i })).not.toBeInTheDocument();
    });

    it('authenticates with default static password "admin123" and unlocks dashboard', async () => {
      renderComponent(false);

      const passwordInput = screen.getByLabelText(/Senha de Administrador/i);
      const submitBtn = screen.getByRole('button', { name: /Acessar Painel/i });

      fireEvent.change(passwordInput, { target: { value: 'admin123' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Painel Operacional de Leads')).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: /Data\/Hora/i })).toBeInTheDocument();
        expect(screen.getByText('Mariana Souza')).toBeInTheDocument();
      });

      // Session storage is populated
      expect(window.sessionStorage.getItem(ADMIN_AUTH_SESSION_KEY)).toBe('true');
    });

    it('allows logging out and returns back to the login screen', async () => {
      renderComponent(true);

      await waitFor(() => {
        expect(screen.getByText('Painel Operacional de Leads')).toBeInTheDocument();
      });

      const logoutBtn = screen.getByRole('button', { name: /Sair/i });
      fireEvent.click(logoutBtn);

      await waitFor(() => {
        expect(screen.getByText('Acesso Restrito')).toBeInTheDocument();
        expect(screen.getByLabelText(/Senha de Administrador/i)).toBeInTheDocument();
      });

      expect(window.sessionStorage.getItem(ADMIN_AUTH_SESSION_KEY)).toBeNull();
    });
  });

  describe('Feature 2: Lead Deletion with Confirmation Modal', () => {
    it('renders delete buttons with trash icons in the actions column for each lead', async () => {
      renderComponent(true);

      await waitFor(() => {
        expect(screen.getByText('Mariana Souza')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /Excluir lead/i });
      expect(deleteButtons.length).toBeGreaterThan(0);
      expect(deleteButtons[0]).toHaveAttribute('title', expect.stringContaining('Excluir lead'));
    });

    it('aborts deletion when user cancels the confirmation dialog', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      renderComponent(true);

      await waitFor(() => {
        expect(screen.getByText('Mariana Souza')).toBeInTheDocument();
      });

      const deleteMarianaBtn = screen.getByRole('button', { name: /Excluir lead Mariana Souza/i });
      fireEvent.click(deleteMarianaBtn);

      expect(confirmSpy).toHaveBeenCalledWith('Tem certeza que deseja excluir permanentemente este lead?');

      // Lead must still remain in UI and repo
      expect(screen.getByText('Mariana Souza')).toBeInTheDocument();
      const allLeads = await repo.getAll();
      expect(allLeads.some((l) => l.name === 'Mariana Souza')).toBe(true);
    });

    it('deletes lead permanently when user confirms and updates table immediately', async () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      renderComponent(true);

      await waitFor(() => {
        expect(screen.getByText('Mariana Souza')).toBeInTheDocument();
      });

      const deleteMarianaBtn = screen.getByRole('button', { name: /Excluir lead Mariana Souza/i });
      fireEvent.click(deleteMarianaBtn);

      expect(confirmSpy).toHaveBeenCalledWith('Tem certeza que deseja excluir permanentemente este lead?');

      // UI updates immediately (Mariana is removed)
      await waitFor(() => {
        expect(screen.queryByText('Mariana Souza')).not.toBeInTheDocument();
      });

      // Storage repository has also deleted the record
      const allLeads = await repo.getAll();
      expect(allLeads.some((l) => l.name === 'Mariana Souza')).toBe(false);
    });
  });
});
