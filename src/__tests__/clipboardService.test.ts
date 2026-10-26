import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildChatGptPrompt, copyTextToClipboard } from '../services/clipboardService';
import { Lead } from '../types/lead';

describe('clipboardService', () => {
  const mockLead: Lead = {
    id: 'lead-test-1',
    name: 'Ana Carolina Pereira',
    link: 'https://linkedin.com/in/anacarolina-dev',
    areaRole: 'Engenheira de Dados GCP',
    status: 'Novo',
    createdAt: '2026-10-26T12:00:00.000Z',
  };

  it('builds structured ChatGPT prompt containing lead name, areaRole, and link', () => {
    const prompt = buildChatGptPrompt(mockLead);

    expect(prompt).toContain('Ana Carolina Pereira');
    expect(prompt).toContain('Engenheira de Dados GCP');
    expect(prompt).toContain('https://linkedin.com/in/anacarolina-dev');
    expect(prompt).toContain('Diagnóstico dos filtros ATS');
    expect(prompt).toContain('Headline do LinkedIn Otimizado');
    expect(prompt).toContain('STAR');
  });

  describe('copyTextToClipboard', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('uses navigator.clipboard.writeText when available', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      const result = await copyTextToClipboard('Texto de teste');
      expect(result).toBe(true);
      expect(writeTextMock).toHaveBeenCalledWith('Texto de teste');
    });

    it('falls back to document.execCommand when navigator.clipboard fails', async () => {
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockRejectedValue(new Error('Permission denied')),
        },
      });

      // Mock execCommand
      document.execCommand = vi.fn().mockReturnValue(true);

      const result = await copyTextToClipboard('Fallback text');
      expect(result).toBe(true);
      expect(document.execCommand).toHaveBeenCalledWith('copy');
    });
  });
});
