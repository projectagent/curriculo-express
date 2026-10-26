import { describe, it, expect } from 'vitest';
import { isValidUrl, validateLeadForm } from '../utils/validators';

describe('validators', () => {
  describe('isValidUrl', () => {
    it('accepts full URLs with http and https', () => {
      expect(isValidUrl('https://linkedin.com/in/usuario')).toBe(true);
      expect(isValidUrl('http://meusite.com.br/cv.pdf')).toBe(true);
      expect(isValidUrl('https://drive.google.com/file/d/123')).toBe(true);
    });

    it('accepts URLs without protocol (normalizing with https)', () => {
      expect(isValidUrl('linkedin.com/in/usuario')).toBe(true);
      expect(isValidUrl('github.com/developer')).toBe(true);
    });

    it('rejects invalid or empty strings', () => {
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('   ')).toBe(false);
      expect(isValidUrl('not-a-valid-domain')).toBe(false);
    });
  });

  describe('validateLeadForm', () => {
    it('returns valid when all fields are properly filled', () => {
      const result = validateLeadForm({
        name: 'Mariana Souza',
        link: 'https://linkedin.com/in/mariana-souza',
        areaRole: 'Frontend Developer',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('returns error when name is empty or too short', () => {
      const empty = validateLeadForm({
        name: '',
        link: 'https://linkedin.com/in/mariana',
        areaRole: 'Frontend Developer',
      });
      expect(empty.isValid).toBe(false);
      expect(empty.errors.name).toBe('Por favor, informe seu nome completo.');

      const short = validateLeadForm({
        name: 'Al',
        link: 'https://linkedin.com/in/mariana',
        areaRole: 'Frontend Developer',
      });
      expect(short.isValid).toBe(false);
      expect(short.errors.name).toBe('O nome deve ter no mínimo 3 caracteres.');
    });

    it('returns error when link is invalid or empty', () => {
      const empty = validateLeadForm({
        name: 'Mariana Souza',
        link: '',
        areaRole: 'Frontend Developer',
      });
      expect(empty.isValid).toBe(false);
      expect(empty.errors.link).toBe('Por favor, informe o link do seu LinkedIn ou currículo.');

      const invalid = validateLeadForm({
        name: 'Mariana Souza',
        link: 'invalid-url',
        areaRole: 'Frontend Developer',
      });
      expect(invalid.isValid).toBe(false);
      expect(invalid.errors.link).toContain('Insira um link válido');
    });

    it('returns error when areaRole is empty', () => {
      const empty = validateLeadForm({
        name: 'Mariana Souza',
        link: 'https://linkedin.com/in/mariana',
        areaRole: '   ',
      });
      expect(empty.isValid).toBe(false);
      expect(empty.errors.areaRole).toBe('Por favor, informe sua área de atuação ou cargo desejado.');
    });
  });
});
