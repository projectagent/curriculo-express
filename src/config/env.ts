import { DEFAULT_WHATSAPP_PHONE } from './constants';

export function getWhatsAppTargetPhone(): string {
  const envPhone = import.meta.env.VITE_WHATSAPP_PHONE;
  if (typeof envPhone === 'string' && envPhone.trim().length > 0) {
    const digitsOnly = envPhone.replace(/\D/g, '');
    if (digitsOnly.length >= 8) {
      return digitsOnly;
    }
  }
  return DEFAULT_WHATSAPP_PHONE;
}

export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return 'http://localhost:3001';
}

export function getAdminPassword(): string {
  const envPassword = import.meta.env.VITE_ADMIN_PASSWORD;
  if (typeof envPassword === 'string' && envPassword.trim().length > 0) {
    return envPassword.trim();
  }
  return 'admin123';
}
