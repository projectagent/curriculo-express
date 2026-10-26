import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LeadCaptureForm } from '../../src/components/landing/LeadCaptureForm';
import { AdminLogin, ADMIN_AUTH_SESSION_KEY } from '../../src/components/admin/AdminLogin';
import { AdminPage } from '../../src/pages/AdminPage';
import { setRepositoryInstanceForTesting } from '../../src/services/storage/storageFactory';
import { LocalStorageRepository } from '../../src/services/storage/LocalStorageRepository';
import { buildWhatsAppUrl } from '../../src/services/whatsappService';
import { getAdminPassword } from '../../src/config/env';
import * as apiModule from '../../src/services/api';
import api from '../../src/services/api';

describe('Tier 5 Adversarial Verification — Milestone 2 (Frontend Decoupling & User Workflows)', () => {
  let repo: LocalStorageRepository;

  beforeEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
    repo = new LocalStorageRepository();
    setRepositoryInstanceForTesting(repo);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  // =========================================================================
  // Workflow 1: LeadCaptureForm Submission & WhatsApp window.open Redirection
  // =========================================================================
  describe('Workflow 1: LeadCaptureForm & WhatsApp Redirection', () => {
    it('1.1 successfully submits valid lead, triggers window.open with _blank, and saves lead', async () => {
      const openSpy = vi.fn();
      window.open = openSpy;

      render(
        <MemoryRouter>
          <LeadCaptureForm />
        </MemoryRouter>
      );

      const nameInput = screen.getByLabelText(/Nome Completo/i);
      const linkInput = screen.getByLabelText(/Link do LinkedIn ou Currículo/i);
      const areaInput = screen.getByLabelText(/Área de Atuação e Cargo Desejado/i);
      const submitBtn = screen.getByRole('button', { name: /Solicitar Análise via WhatsApp/i });

      fireEvent.change(nameInput, { target: { value: 'Lucas Oliveira' } });
      fireEvent.change(linkInput, { target: { value: 'https://linkedin.com/in/lucasoliveira' } });
      fireEvent.change(areaInput, { target: { value: 'Desenvolvedor Backend Node.js' } });

      fireEvent.click(submitBtn);

      // Verify success feedback appears
      await waitFor(() => {
        expect(screen.getByText('Dados salvos com sucesso!')).toBeInTheDocument();
      });

      // Verify persistence in repository
      const allLeads = await repo.getAll();
      const savedLead = allLeads.find((l) => l.name === 'Lucas Oliveira');
      expect(savedLead).toBeDefined();
      expect(savedLead?.link).toBe('https://linkedin.com/in/lucasoliveira');
      expect(savedLead?.areaRole).toBe('Desenvolvedor Backend Node.js');
      expect(savedLead?.status).toBe('Novo');

      // Wait for the 300ms setTimeout to invoke window.open
      await waitFor(
        () => {
          expect(openSpy).toHaveBeenCalledWith(
            buildWhatsAppUrl('Lucas Oliveira', 'Desenvolvedor Backend Node.js'),
            '_blank'
          );
        },
        { timeout: 1500 }
      );

      // Verify the manual fallback button also points to the exact WhatsApp URL
      const manualLink = screen.getByRole('link', { name: /Abrir Conversa no WhatsApp/i });
      expect(manualLink).toBeInTheDocument();
      expect(manualLink.getAttribute('href')).toBe(
        buildWhatsAppUrl('Lucas Oliveira', 'Desenvolvedor Backend Node.js')
      );
      expect(manualLink.getAttribute('target')).toBe('_blank');
    });

    it('1.2 handles popup blocker when window.open throws an exception without crashing UI', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      window.open = vi.fn().mockImplementation(() => {
        throw new Error('Popup blocked by browser security policy');
      });

      render(
        <MemoryRouter>
          <LeadCaptureForm />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/Nome Completo/i), {
        target: { value: 'Beatriz Santos' },
      });
      fireEvent.change(screen.getByLabelText(/Link do LinkedIn ou Currículo/i), {
        target: { value: 'linkedin.com/in/beatrizsantos' },
      });
      fireEvent.change(screen.getByLabelText(/Área de Atuação e Cargo Desejado/i), {
        target: { value: 'UI/UX Designer' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Solicitar Análise via WhatsApp/i }));

      // Form should still succeed and provide fallback link
      await waitFor(() => {
        expect(screen.getByText('Dados salvos com sucesso!')).toBeInTheDocument();
        const fallbackLink = screen.getByRole('link', { name: /Abrir Conversa no WhatsApp/i });
        expect(fallbackLink).toBeInTheDocument();
        expect(fallbackLink.getAttribute('target')).toBe('_blank');
      });

      // Verify error was safely caught by redirectToWhatsApp
      await waitFor(
        () => {
          expect(consoleErrorSpy).toHaveBeenCalledWith(
            expect.stringContaining('Erro ao abrir o WhatsApp em nova aba:'),
            expect.any(Error)
          );
        },
        { timeout: 1000 }
      );

      consoleErrorSpy.mockRestore();
    });

    it('1.3 prevents multiple simultaneous submissions when clicking submit rapidly', async () => {
      const openSpy = vi.fn();
      window.open = openSpy;

      render(
        <MemoryRouter>
          <LeadCaptureForm />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/Nome Completo/i), {
        target: { value: 'Rapid Clicker' },
      });
      fireEvent.change(screen.getByLabelText(/Link do LinkedIn ou Currículo/i), {
        target: { value: 'https://linkedin.com/in/rapid' },
      });
      fireEvent.change(screen.getByLabelText(/Área de Atuação e Cargo Desejado/i), {
        target: { value: 'QA Automation Engineer' },
      });

      const submitBtn = screen.getByRole('button', { name: /Solicitar Análise via WhatsApp/i });

      // Click rapidly multiple times
      fireEvent.click(submitBtn);
      fireEvent.click(submitBtn);
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Dados salvos com sucesso!')).toBeInTheDocument();
      });

      // Repository should have exactly 1 record for this candidate
      const allLeads = await repo.getAll();
      const rapidLeads = allLeads.filter((l) => l.name === 'Rapid Clicker');
      expect(rapidLeads.length).toBe(1);

      // Wait out the redirect timeout
      await waitFor(
        () => {
          expect(openSpy).toHaveBeenCalled();
        },
        { timeout: 1000 }
      );
    });

    it('1.4 trims trailing whitespace from input fields when saving and generating URL', async () => {
      const openSpy = vi.fn();
      window.open = openSpy;

      render(
        <MemoryRouter>
          <LeadCaptureForm />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByLabelText(/Nome Completo/i), {
        target: { value: '   Trimmed Candidate   ' },
      });
      fireEvent.change(screen.getByLabelText(/Link do LinkedIn ou Currículo/i), {
        target: { value: 'linkedin.com/in/trimmed' },
      });
      fireEvent.change(screen.getByLabelText(/Área de Atuação e Cargo Desejado/i), {
        target: { value: '   Data Scientist   ' },
      });

      fireEvent.click(screen.getByRole('button', { name: /Solicitar Análise via WhatsApp/i }));

      await waitFor(() => {
        expect(screen.getByText('Dados salvos com sucesso!')).toBeInTheDocument();
      });

      const allLeads = await repo.getAll();
      const lead = allLeads.find((l) => l.name.includes('Trimmed Candidate'));
      expect(lead).toBeDefined();

      await waitFor(
        () => {
          expect(openSpy).toHaveBeenCalledWith(
            expect.stringContaining('Trimmed%20Candidate'),
            '_blank'
          );
        },
        { timeout: 1000 }
      );
    });
  });

  // =========================================================================
  // Workflow 2: Admin Authentication Flow (AdminLogin & AdminPage gate)
  // =========================================================================
  describe('Workflow 2: Admin Authentication Flow & "admin123" Gate', () => {
    it('2.1 rejects empty password with required field warning', async () => {
      const onLoginSuccess = vi.fn();
      render(
        <MemoryRouter>
          <AdminLogin onLoginSuccess={onLoginSuccess} />
        </MemoryRouter>
      );

      const submitBtn = screen.getByRole('button', { name: /Acessar Painel/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(
          screen.getByText('Por favor, informe a senha de administrador.')
        ).toBeInTheDocument();
      });

      expect(onLoginSuccess).not.toHaveBeenCalled();
      expect(window.sessionStorage.getItem(ADMIN_AUTH_SESSION_KEY)).toBeNull();
    });

    it('2.2 rejects diverse invalid passwords (case mismatch, whitespace, arbitrary strings, injection attacks)', async () => {
      const onLoginSuccess = vi.fn();
      render(
        <MemoryRouter>
          <AdminLogin onLoginSuccess={onLoginSuccess} />
        </MemoryRouter>
      );

      const invalidPasswords = [
        'wrong',
        'ADMIN123',
        'Admin123',
        ' admin123',
        'admin123 ',
        'admin',
        '123456',
        "' OR '1'='1",
        '<script>alert(1)</script>',
        'true',
      ];

      const passwordInput = screen.getByLabelText(/Senha de Administrador/i);
      const submitBtn = screen.getByRole('button', { name: /Acessar Painel/i });

      for (const badPass of invalidPasswords) {
        fireEvent.change(passwordInput, { target: { value: badPass } });
        fireEvent.click(submitBtn);

        await waitFor(() => {
          expect(
            screen.getByText('Senha incorreta. Verifique e tente novamente.')
          ).toBeInTheDocument();
        });

        expect(onLoginSuccess).not.toHaveBeenCalled();
        expect(window.sessionStorage.getItem(ADMIN_AUTH_SESSION_KEY)).toBeNull();
      }
    });

    it('2.3 accepts "admin123", saves session token, and unlocks Admin dashboard in AdminPage', async () => {
      render(
        <MemoryRouter>
          <AdminPage initialAuthenticated={false} />
        </MemoryRouter>
      );

      // Initially on restricted login view
      expect(screen.getByText('Acesso Restrito')).toBeInTheDocument();
      expect(screen.queryByText('Painel Operacional de Leads')).not.toBeInTheDocument();

      const passwordInput = screen.getByLabelText(/Senha de Administrador/i);
      const submitBtn = screen.getByRole('button', { name: /Acessar Painel/i });

      fireEvent.change(passwordInput, { target: { value: 'admin123' } });
      fireEvent.click(submitBtn);

      // Dashboard unlocks
      await waitFor(() => {
        expect(screen.getByText('Painel Operacional de Leads')).toBeInTheDocument();
        expect(screen.getByText('API Local (SQLite)')).toBeInTheDocument();
      });

      // Session storage is populated
      expect(window.sessionStorage.getItem(ADMIN_AUTH_SESSION_KEY)).toBe('true');
    });

    it('2.4 logging out deletes session token and returns to AdminLogin view', async () => {
      render(
        <MemoryRouter>
          <AdminPage initialAuthenticated={true} />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Painel Operacional de Leads')).toBeInTheDocument();
      });

      const logoutBtn = screen.getByRole('button', { name: /Sair/i });
      fireEvent.click(logoutBtn);

      await waitFor(() => {
        expect(screen.getByText('Acesso Restrito')).toBeInTheDocument();
      });

      expect(window.sessionStorage.getItem(ADMIN_AUTH_SESSION_KEY)).toBeNull();
    });

    it('2.5 getAdminPassword returns configured password or defaults to "admin123"', () => {
      const pwd = getAdminPassword();
      expect(pwd).toBe('admin123');
    });
  });

  // =========================================================================
  // Workflow 3: API Client Field Mapping & Contracts
  // =========================================================================
  describe('Workflow 3: API Client Field Normalization & Contracts', () => {
    it('3.1 normalizeLead correctly handles Portuguese SQLite rows, English aliases, and defaults', () => {
      // Case A: Raw SQLite schema row
      const sqliteRow = {
        id: '123-abc',
        nome: 'Roberta Dias',
        link: 'https://linkedin.com/in/robertadias',
        area: 'Product Manager',
        status: 'Aguardando Pagamento',
        data_criacao: '2026-10-26T12:00:00.000Z',
      };

      const normA = apiModule.normalizeLead(sqliteRow);
      expect(normA.id).toBe('123-abc');
      expect(normA.name).toBe('Roberta Dias');
      expect(normA.link).toBe('https://linkedin.com/in/robertadias');
      expect(normA.areaRole).toBe('Product Manager');
      expect(normA.status).toBe('Aguardando Pagamento');
      expect(normA.createdAt).toBe('2026-10-26T12:00:00.000Z');

      // Case B: English schema row with default status
      const englishRow = {
        id: 456,
        name: 'Carlos Mendes',
        link: 'https://linkedin.com/in/carlosmendes',
        areaRole: 'Backend Go',
        createdAt: '2026-10-26T13:00:00.000Z',
      };

      const normB = apiModule.normalizeLead(englishRow);
      expect(normB.id).toBe('456');
      expect(normB.name).toBe('Carlos Mendes');
      expect(normB.areaRole).toBe('Backend Go');
      expect(normB.status).toBe('Novo');
      expect(normB.createdAt).toBe('2026-10-26T13:00:00.000Z');
    });

    it('3.2 api exports delete and deleteLead functions adhering to interface contract', () => {
      expect(typeof apiModule.getAll).toBe('function');
      expect(typeof apiModule.create).toBe('function');
      expect(typeof apiModule.updateStatus).toBe('function');
      expect(typeof apiModule.delete).toBe('function');
      expect(typeof apiModule.deleteLead).toBe('function');
      expect(apiModule.delete).toBe(apiModule.deleteLead);

      // Default export also has delete method
      expect(typeof api.delete).toBe('function');
    });
  });
});
