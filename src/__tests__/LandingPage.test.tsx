import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import { setRepositoryInstanceForTesting } from '../services/storage/storageFactory';
import { LocalStorageRepository } from '../services/storage/LocalStorageRepository';

describe('LandingPage Component', () => {
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
        <LandingPage />
      </BrowserRouter>
    );

  it('renders Hero title and subtitle correctly', () => {
    renderComponent();

    // Verifies exact required headline
    expect(
      screen.getByText(
        /Seu currículo não passa nos filtros dos recrutadores\? Nós reescrevemos para você ser chamado para entrevistas/i
      )
    ).toBeInTheDocument();

    // Verifies subtitle turnaround mention
    expect(
      screen.getByText(/entregues em poucas horas/i)
    ).toBeInTheDocument();
  });

  it('renders Como Funciona section with 3 sequential steps', () => {
    renderComponent();

    expect(screen.getByText('Preencha o formulário')).toBeInTheDocument();
    expect(
      screen.getByText('Combine detalhes e pagamento no WhatsApp')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Receba seu perfil otimizado em poucas horas')
    ).toBeInTheDocument();
  });

  it('validates required fields on empty submit and displays error hints', async () => {
    renderComponent();

    const submitBtn = screen.getByRole('button', {
      name: /Solicitar Análise via WhatsApp/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Por favor, informe seu nome completo/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Por favor, informe o link do seu LinkedIn ou currículo/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Por favor, informe sua área de atuação ou cargo desejado/i)
      ).toBeInTheDocument();
    });
  });

  it('submits valid form, saves lead to repository, and displays WhatsApp redirect feedback', async () => {
    // Mock window.open
    const openMock = vi.fn();
    window.open = openMock;

    renderComponent();

    const nameInput = screen.getByLabelText(/Nome Completo/i);
    const linkInput = screen.getByLabelText(/Link do LinkedIn ou Currículo/i);
    const roleInput = screen.getByLabelText(/Área de Atuação e Cargo Desejado/i);
    const submitBtn = screen.getByRole('button', {
      name: /Solicitar Análise via WhatsApp/i,
    });

    fireEvent.change(nameInput, { target: { value: 'Eduardo Silveira' } });
    fireEvent.change(linkInput, {
      target: { value: 'https://linkedin.com/in/eduardo-silveira' },
    });
    fireEvent.change(roleInput, {
      target: { value: 'Desenvolvedor Full Stack React/Node' },
    });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Dados salvos com sucesso!/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Abrir Conversa no WhatsApp/i)
      ).toBeInTheDocument();
    });

    // Check repository contains newly created lead
    const allLeads = await repo.getAll();
    const created = allLeads.find((l) => l.name === 'Eduardo Silveira');
    expect(created).toBeDefined();
    expect(created?.areaRole).toBe('Desenvolvedor Full Stack React/Node');
    expect(created?.status).toBe('Novo');
  });
});
