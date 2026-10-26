import { getWhatsAppTargetPhone } from '../config/env';

export function formatWhatsAppMessage(name: string, areaRole: string): string {
  return `Olá, acabei de preencher o formulário. Meu nome é ${name.trim()}, sou da área de ${areaRole.trim()} e quero a revisão express.`;
}

export function buildWhatsAppUrl(name: string, areaRole: string, phone?: string): string {
  const sanitized = phone ? phone.replace(/\D/g, '') : '';
  const targetPhone = sanitized.length > 0 ? sanitized : getWhatsAppTargetPhone();
  const rawMessage = formatWhatsAppMessage(name, areaRole);
  const encodedText = encodeURIComponent(rawMessage);
  return `https://wa.me/${targetPhone}?text=${encodedText}`;
}

export function redirectToWhatsApp(url: string): void {
  if (typeof window === 'undefined') return;

  try {
    window.open(url, '_blank');
  } catch (err) {
    console.error('Erro ao abrir o WhatsApp em nova aba:', err);
  }
}
