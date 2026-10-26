import { Lead } from '../types/lead';

export function buildChatGptPrompt(lead: Lead): string {
  return [
    `Você é um especialista sênior em Tech Recruiting e Carreira em Tecnologia.`,
    `Estou realizando uma Revisão Express de Currículo e LinkedIn para o seguinte candidato:`,
    ``,
    `• Nome: ${lead.name}`,
    `• Área de Atuação / Cargo Alvo: ${lead.areaRole}`,
    `• Link do LinkedIn / Currículo: ${lead.link}`,
    ``,
    `Por favor, gere uma análise executiva estruturada com os seguintes pontos:`,
    `1. Diagnóstico dos filtros ATS: Quais palavras-chave e termos técnicos obrigatórios estão faltando para ${lead.areaRole}?`,
    `2. Headline do LinkedIn Otimizado: 3 opções persuasivas com foco em busca ativa de recrutadores.`,
    `3. Resumo Profissional ("Sobre"): Versão reescrita e impactante focada em resultados e competências chave.`,
    `4. Otimização de Experiências: Reformulação das principais responsabilidades aplicando a fórmula STAR (Situação, Tarefa, Ação, Resultado) com métricas quantitativas.`,
    `5. Plano de Ação Imediato: 3 alterações rápidas para aumentar a taxa de chamadas para entrevistas esta semana.`,
  ].join('\n');
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  // Method 1: Modern asynchronous Clipboard API
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('navigator.clipboard.writeText falhou, tentando fallback por execCommand:', err);
    }
  }

  // Method 2: Fallback using hidden textarea & document.execCommand
  if (typeof document !== 'undefined') {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.setAttribute('readonly', '');
      textArea.style.position = 'fixed';
      textArea.style.top = '-9999px';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (fallbackErr) {
      console.error('Falha em todos os métodos de cópia para clipboard:', fallbackErr);
      return false;
    }
  }

  return false;
}
