import { useState, useCallback } from 'react';
import { Lead } from '../types/lead';
import { buildChatGptPrompt, copyTextToClipboard } from '../services/clipboardService';
import { showToast } from './useToast';

export function useClipboard() {
  const [copiedLeadId, setCopiedLeadId] = useState<string | null>(null);
  const [isCopying, setIsCopying] = useState<boolean>(false);

  const copyLeadPrompt = useCallback(async (lead: Lead): Promise<boolean> => {
    setIsCopying(true);
    try {
      const prompt = buildChatGptPrompt(lead);
      const success = await copyTextToClipboard(prompt);

      if (success) {
        setCopiedLeadId(lead.id);
        showToast(
          `Prompt do ChatGPT para "${lead.name}" copiado com sucesso!`,
          'success',
          'Contexto Copiado'
        );

        setTimeout(() => {
          setCopiedLeadId((current) => (current === lead.id ? null : current));
        }, 3000);
        return true;
      } else {
        showToast(
          'Não foi possível copiar o texto automaticamente. Verifique as permissões do seu navegador.',
          'error',
          'Erro ao Copiar'
        );
        return false;
      }
    } catch (err) {
      console.error('Erro ao copiar contexto do lead:', err);
      showToast('Ocorreu um erro ao tentar copiar o contexto.', 'error');
      return false;
    } finally {
      setIsCopying(false);
    }
  }, []);

  return {
    copiedLeadId,
    isCopying,
    copyLeadPrompt,
  };
}
