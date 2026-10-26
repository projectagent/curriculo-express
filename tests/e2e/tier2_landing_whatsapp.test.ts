import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from '../../src/pages/LandingPage';
import { buildWhatsAppUrl, formatWhatsAppMessage } from '../../src/services/whatsappService';
import { getStorageRepository } from '../../src/services/storage/storageFactory';

const renderLanding = () =>
  render(React.createElement(MemoryRouter, null, React.createElement(LandingPage)));

describe('Tier 2: Feature Coverage — Landing Page & WhatsApp Flow', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // =========================================================================
  // Feature 1: Landing Page Hero headline matches exact text (>= 5 test cases)
  // =========================================================================
  describe('Feature 1: Hero Section Headline & Value Proposition', () => {
    it('2.1.1 renders the exact headline verbatim in primary heading h1', () => {
      renderLanding();

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toBe(
        'Seu currículo não passa nos filtros dos recrutadores? Nós reescrevemos para você ser chamado para entrevistas'
      );
    });

    it('2.1.2 renders subtitle emphasizing fast turnaround in a few hours ("poucas horas")', () => {
      renderLanding();

      const subtitle = screen.getByText(/reescrita do seu perfil/i);
      expect(subtitle).toBeInTheDocument();
      expect(subtitle.textContent).toMatch(/em poucas horas/i);
      expect(subtitle.textContent).toMatch(/algoritmos ATS/i);
    });

    it('2.1.3 renders hero badge with positioning copy', () => {
      renderLanding();

      expect(
        screen.getByText('Aceleração de Carreira Tech com Inteligência e Estratégia')
      ).toBeInTheDocument();
    });

    it('2.1.4 renders proof bullets including ATS filters and WhatsApp alignment', () => {
      renderLanding();

      expect(screen.getByText('Adequação completa a filtros ATS')).toBeInTheDocument();
      expect(screen.getByText('Otimização estratégica de LinkedIn')).toBeInTheDocument();
      expect(screen.getByText('Retorno em poucas horas')).toBeInTheDocument();
      expect(screen.getByText('Alinhamento direto via WhatsApp')).toBeInTheDocument();
    });

    it('2.1.5 applies high-contrast dark navy background theme styling to the hero section', () => {
      const { container } = renderLanding();

      const heroSection = container.querySelector('section');
      expect(heroSection).not.toBeNull();
      expect(heroSection?.className).toContain('bg-gradient-to-b');
      expect(heroSection?.className).toContain('navy-950');
    });
  });

  // =========================================================================
  // Feature 2: Como Funciona 3 steps present (>= 5 test cases)
  // =========================================================================
  describe('Feature 2: Como Funciona 3 Steps Section', () => {
    it('2.2.1 renders the section title "Como Funciona a Revisão Express"', () => {
      renderLanding();

      const sectionTitle = screen.getByRole('heading', {
        level: 2,
        name: /Como Funciona a Revisão Express/i,
      });
      expect(sectionTitle).toBeInTheDocument();
    });

    it('2.2.2 renders exactly 3 numbered step items', () => {
      const { container } = renderLanding();

      const stepsContainer = container.querySelector('#como-funciona');
      expect(stepsContainer).not.toBeNull();

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('2.2.3 renders Step 1 with exact title "Preencha o formulário"', () => {
      renderLanding();

      expect(screen.getByText('Preencha o formulário')).toBeInTheDocument();
      expect(
        screen.getByText(/Envie seu nome, link do currículo ou LinkedIn e a área de tecnologia/i)
      ).toBeInTheDocument();
    });

    it('2.2.4 renders Step 2 with exact title "Combine detalhes e pagamento no WhatsApp"', () => {
      renderLanding();

      expect(screen.getByText('Combine detalhes e pagamento no WhatsApp')).toBeInTheDocument();
      expect(
        screen.getByText(/Você será direcionado diretamente ao nosso WhatsApp oficial/i)
      ).toBeInTheDocument();
    });

    it('2.2.5 renders Step 3 with exact title "Receba seu perfil otimizado em poucas horas"', () => {
      renderLanding();

      expect(screen.getByText('Receba seu perfil otimizado em poucas horas')).toBeInTheDocument();
      expect(
        screen.getByText(/diagnóstico ATS e entrega sua nova versão pronta para aplicar/i)
      ).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Feature 3: Form fields validation (Nome, Link, Área/Cargo) (>= 5 test cases)
  // =========================================================================
  describe('Feature 3: Lead Capture Form Fields & Validation', () => {
    it('2.3.1 renders all 3 required input fields and the submit CTA button', () => {
      renderLanding();

      expect(screen.getByLabelText(/Nome Completo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Link do LinkedIn ou Currículo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Área de Atuação e Cargo Desejado/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Solicitar Análise via WhatsApp/i })
      ).toBeInTheDocument();
    });

    it('2.3.2 blocks submission when all fields are empty and renders 3 validation errors', async () => {
      renderLanding();

      const submitBtn = screen.getByRole('button', { name: /Solicitar Análise via WhatsApp/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Por favor, informe seu nome completo/i)).toBeInTheDocument();
        expect(
          screen.getByText(/Por favor, informe o link do seu LinkedIn ou currículo/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/Por favor, informe sua área de atuação ou cargo desejado/i)
        ).toBeInTheDocument();
      });
    });

    it('2.3.3 enforces minimum length >= 3 for candidate name field', async () => {
      renderLanding();

      const nameInput = screen.getByLabelText(/Nome Completo/i);
      fireEvent.change(nameInput, { target: { value: 'Lu' } });
      fireEvent.blur(nameInput);

      const submitBtn = screen.getByRole('button', { name: /Solicitar Análise via WhatsApp/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/O nome deve ter no mínimo 3 caracteres/i)).toBeInTheDocument();
      });
    });

    it('2.3.4 enforces valid URL pattern for LinkedIn or CV link field', async () => {
      renderLanding();

      const linkInput = screen.getByLabelText(/Link do LinkedIn ou Currículo/i);
      fireEvent.change(linkInput, { target: { value: 'not-a-valid-url' } });
      fireEvent.blur(linkInput);

      const submitBtn = screen.getByRole('button', { name: /Solicitar Análise via WhatsApp/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Insira um link válido/i)).toBeInTheDocument();
      });
    });

    it('2.3.5 enforces minimum length >= 2 for area / role field', async () => {
      renderLanding();

      const areaInput = screen.getByLabelText(/Área de Atuação e Cargo Desejado/i);
      fireEvent.change(areaInput, { target: { value: 'X' } });
      fireEvent.blur(areaInput);

      const submitBtn = screen.getByRole('button', { name: /Solicitar Análise via WhatsApp/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(
          screen.getByText(/A área de atuação deve ter no mínimo 2 caracteres/i)
        ).toBeInTheDocument();
      });
    });
  });

  // =========================================================================
  // Feature 4: WhatsApp URL constructor with exact text template (>= 5 test cases)
  // =========================================================================
  describe('Feature 4: WhatsApp URL Constructor & Redirection Flow', () => {
    it('2.4.1 starts with https://wa.me/ followed by clean numeric phone digits', () => {
      const url = buildWhatsAppUrl('Carlos Silva', 'Engenheiro de Dados', '+55 (11) 98765-4321');
      expect(url.startsWith('https://wa.me/5511987654321?text=')).toBe(true);
    });

    it('2.4.2 matches the verbatim template text prior to URI encoding', () => {
      const raw = formatWhatsAppMessage('Ana Clara', 'Frontend Developer');
      expect(raw).toBe(
        'Olá, acabei de preencher o formulário. Meu nome é Ana Clara, sou da área de Frontend Developer e quero a revisão express.'
      );
    });

    it('2.4.3 uses full encodeURIComponent escaping all spaces, commas and special characters', () => {
      const url = buildWhatsAppUrl('Mariana Souza', 'Tech Lead & Arquiteta', '5511999999999');
      const textParam = url.split('?text=')[1];

      // Exact percent encoding verification
      expect(textParam).toContain('Ol%C3%A1%2C%20acabei%20de%20preencher%20o%20formul%C3%A1rio.');
      expect(textParam).toContain('Meu%20nome%20%C3%A9%20Mariana%20Souza%2C');
      expect(textParam).toContain('Tech%20Lead%20%26%20Arquiteta');
      expect(textParam).toContain('revis%C3%A3o%20express.');

      // Decoding produces the exact original message
      const decoded = decodeURIComponent(textParam);
      expect(decoded).toBe(
        'Olá, acabei de preencher o formulário. Meu nome é Mariana Souza, sou da área de Tech Lead & Arquiteta e quero a revisão express.'
      );
    });

    it('2.4.4 submitting valid form persists lead to storage repository', async () => {
      renderLanding();

      const nameInput = screen.getByLabelText(/Nome Completo/i);
      const linkInput = screen.getByLabelText(/Link do LinkedIn ou Currículo/i);
      const areaInput = screen.getByLabelText(/Área de Atuação e Cargo Desejado/i);
      const submitBtn = screen.getByRole('button', { name: /Solicitar Análise via WhatsApp/i });

      fireEvent.change(nameInput, { target: { value: 'Eduardo Pereira' } });
      fireEvent.change(linkInput, { target: { value: 'https://linkedin.com/in/eduardop' } });
      fireEvent.change(areaInput, { target: { value: 'DevOps & SRE' } });

      fireEvent.click(submitBtn);

      await waitFor(async () => {
        const repo = getStorageRepository();
        const leads = await repo.getAll();
        const found = leads.find((l) => l.name === 'Eduardo Pereira');
        expect(found).toBeDefined();
        expect(found?.areaRole).toBe('DevOps & SRE');
        expect(found?.status).toBe('Novo');
      });
    });

    it('2.4.5 renders success confirmation banner with direct fallback WhatsApp link', async () => {
      renderLanding();

      const nameInput = screen.getByLabelText(/Nome Completo/i);
      const linkInput = screen.getByLabelText(/Link do LinkedIn ou Currículo/i);
      const areaInput = screen.getByLabelText(/Área de Atuação e Cargo Desejado/i);
      const submitBtn = screen.getByRole('button', { name: /Solicitar Análise via WhatsApp/i });

      fireEvent.change(nameInput, { target: { value: 'Juliana Costa' } });
      fireEvent.change(linkInput, { target: { value: 'https://linkedin.com/in/julianacosta' } });
      fireEvent.change(areaInput, { target: { value: 'Product Designer UI/UX' } });

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Dados salvos com sucesso!')).toBeInTheDocument();
        const directLink = screen.getByRole('link', { name: /Abrir Conversa no WhatsApp/i });
        expect(directLink).toBeInTheDocument();
        expect(directLink.getAttribute('href')).toContain('https://wa.me/');
        expect(directLink.getAttribute('href')).toContain('Juliana%20Costa');
      });
    });
  });
});
