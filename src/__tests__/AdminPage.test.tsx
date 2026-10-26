import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminPage } from '../pages/AdminPage';
import { setRepositoryInstanceForTesting } from '../services/storage/storageFactory';
import { LocalStorageRepository } from '../services/storage/LocalStorageRepository';

describe('AdminPage Component', () => {
  let repo: LocalStorageRepository;

  beforeEach(() => {
    window.localStorage.clear();
    repo = new LocalStorageRepository();
    setRepositoryInstanceForTesting(repo);
    vi.restoreAllMocks();
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );

  it('renders table with all 5 mandatory column headers', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Mariana Souza')).toBeInTheDocument();
    });

    // Check mandatory headers
    expect(screen.getByRole('columnheader', { name: /Data\/Hora/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /^Nome$/i })).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: /Link \(LinkedIn \/ CV\)/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /Área \/ Cargo/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /^Status$/i })).toBeInTheDocument();
  });

  it('allows changing status via dropdown and persists the change', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Mariana Souza')).toBeInTheDocument();
    });

    // Mariana Souza initially has status 'Novo'
    const dropdowns = screen.getAllByRole('combobox', { name: /Alterar status do lead/i });
    expect(dropdowns.length).toBeGreaterThan(0);

    const firstDropdown = dropdowns[0];
    expect(firstDropdown).toHaveValue('Novo');

    // Change status to 'Revisando (IA)'
    fireEvent.change(firstDropdown, { target: { value: 'Revisando (IA)' } });

    await waitFor(() => {
      expect(firstDropdown).toHaveValue('Revisando (IA)');
    });

    // Confirm persisted in repository
    const allLeads = await repo.getAll();
    const mariana = allLeads.find((l) => l.name === 'Mariana Souza');
    expect(mariana?.status).toBe('Revisando (IA)');
  });

  it('copies ChatGPT prompt when clicking "Copiar Contexto"', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Mariana Souza')).toBeInTheDocument();
    });

    const copyButtons = screen.getAllByRole('button', { name: /Copiar contexto/i });
    expect(copyButtons.length).toBeGreaterThan(0);

    fireEvent.click(copyButtons[0]);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalled();
      const calledPrompt = writeTextMock.mock.calls[0][0];
      expect(calledPrompt).toContain('Mariana Souza');
      expect(calledPrompt).toContain('Desenvolvedora Frontend React Júnior');
    });
  });
});
