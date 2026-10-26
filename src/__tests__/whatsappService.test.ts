import { describe, it, expect } from 'vitest';
import { buildWhatsAppUrl, formatWhatsAppMessage } from '../services/whatsappService';
import { getWhatsAppTargetPhone } from '../config/env';

describe('whatsappService', () => {
  it('formats WhatsApp message according to exact specification', () => {
    const message = formatWhatsAppMessage('Mariana Souza', 'Frontend React');
    expect(message).toBe(
      'Olá, acabei de preencher o formulário. Meu nome é Mariana Souza, sou da área de Frontend React e quero a revisão express.'
    );
  });

  it('builds valid WhatsApp URL with default phone and encodeURIComponent', () => {
    const url = buildWhatsAppUrl('Mariana Souza', 'Frontend React', '5511999999999');
    const expectedEncoded = encodeURIComponent(
      'Olá, acabei de preencher o formulário. Meu nome é Mariana Souza, sou da área de Frontend React e quero a revisão express.'
    );
    expect(url).toBe(`https://wa.me/5511999999999?text=${expectedEncoded}`);
  });

  it('properly encodes special characters, accents, and symbols', () => {
    const name = "João d'Ávila & Filhos";
    const area = 'C++ / C# Developer & Cloud';
    const url = buildWhatsAppUrl(name, area, '+55 (11) 98765-4321');

    // Phone digits normalized
    expect(url.startsWith('https://wa.me/5511987654321?text=')).toBe(true);

    // Symbols encoded
    expect(url).toContain('%26'); // &
    expect(url).toContain('%2B'); // +
    expect(url).toContain('%2F'); // /
    expect(url).toContain(encodeURIComponent(name));
    expect(url).toContain(encodeURIComponent(area));
  });

  it('trims leading and trailing spaces in name and area', () => {
    const message = formatWhatsAppMessage('   Carlos Silva   ', '   Backend Node.js   ');
    expect(message).toBe(
      'Olá, acabei de preencher o formulário. Meu nome é Carlos Silva, sou da área de Backend Node.js e quero a revisão express.'
    );
  });

  it('safely defaults targetPhone to default phone when provided phone contains no digits', () => {
    const url = buildWhatsAppUrl('Mariana Souza', 'Frontend React', 'invalid-phone-without-digits');
    expect(url.startsWith(`https://wa.me/${getWhatsAppTargetPhone()}?text=`)).toBe(true);
  });
});
