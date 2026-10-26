import { FormValidationErrors } from '../types/common';
import { CreateLeadDTO } from '../types/lead';
import { normalizeUrl } from './formatters';

export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.length < 4 || /\s/.test(trimmed)) return false;

  const normalized = normalizeUrl(trimmed);
  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    // Reject email strings or user credentials in URL
    if (parsed.username) {
      return false;
    }
    const hostname = parsed.hostname;
    if (!hostname || (!hostname.includes('.') && hostname !== 'localhost')) {
      return false;
    }
    // Ensure all hostname labels are non-empty and valid alphanumeric
    const labels = hostname.split('.');
    for (const label of labels) {
      if (!label || !/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(label)) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

export function validateLeadForm(data: Partial<CreateLeadDTO>): {
  isValid: boolean;
  errors: FormValidationErrors;
} {
  const errors: FormValidationErrors = {};

  // Name validation
  const nameTrimmed = data.name?.trim() || '';
  if (!nameTrimmed) {
    errors.name = 'Por favor, informe seu nome completo.';
  } else if (nameTrimmed.length < 3) {
    errors.name = 'O nome deve ter no mínimo 3 caracteres.';
  }

  // Link validation
  const linkTrimmed = data.link?.trim() || '';
  if (!linkTrimmed) {
    errors.link = 'Por favor, informe o link do seu LinkedIn ou currículo.';
  } else if (!isValidUrl(linkTrimmed)) {
    errors.link = 'Insira um link válido (ex: linkedin.com/in/seunome ou link do Drive).';
  }

  // Area / Role validation
  const areaTrimmed = data.areaRole?.trim() || '';
  if (!areaTrimmed) {
    errors.areaRole = 'Por favor, informe sua área de atuação ou cargo desejado.';
  } else if (areaTrimmed.length < 2) {
    errors.areaRole = 'A área de atuação deve ter no mínimo 2 caracteres.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
