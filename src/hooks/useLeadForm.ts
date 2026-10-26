import { useState, useCallback, ChangeEvent, FormEvent } from 'react';
import { CreateLeadDTO } from '../types/lead';
import { FormValidationErrors } from '../types/common';
import { validateLeadForm } from '../utils/validators';
import { createNewLead } from '../services/leadService';
import { buildWhatsAppUrl, redirectToWhatsApp } from '../services/whatsappService';
import { showToast } from './useToast';

interface UseLeadFormOptions {
  autoRedirect?: boolean;
  onSuccess?: (whatsappUrl: string) => void;
}

export function useLeadForm(options: UseLeadFormOptions = { autoRedirect: true }) {
  const [values, setValues] = useState<CreateLeadDTO>({
    name: '',
    link: '',
    areaRole: '',
  });

  const [errors, setErrors] = useState<FormValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));

    // Clear error for field once user types
    setErrors((prev) => {
      if (prev[name as keyof FormValidationErrors]) {
        const next = { ...prev };
        delete next[name as keyof FormValidationErrors];
        return next;
      }
      return prev;
    });
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    // Validate this specific field on blur
    const { errors: validationErrors } = validateLeadForm(values);
    if (validationErrors[name as keyof FormValidationErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validationErrors[name as keyof FormValidationErrors],
      }));
    }
  }, [values]);

  const handleSubmit = useCallback(async (e?: FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    setTouched({
      name: true,
      link: true,
      areaRole: true,
    });

    const { isValid, errors: validationErrors } = validateLeadForm(values);
    if (!isValid) {
      setErrors(validationErrors);
      showToast('Por favor, corrija os erros no formulário antes de enviar.', 'warning');
      return false;
    }

    setIsSubmitting(true);
    try {
      // 1. Save lead to persistence layer
      await createNewLead(values);

      // 2. Generate WhatsApp URL
      const whatsappUrl = buildWhatsAppUrl(values.name, values.areaRole);
      setRedirectUrl(whatsappUrl);
      setIsSuccess(true);

      showToast('Formulário enviado! Redirecionando para o WhatsApp...', 'success');

      if (options.onSuccess) {
        options.onSuccess(whatsappUrl);
      }

      // 3. Trigger immediate redirect if enabled
      if (options.autoRedirect !== false) {
        // Use short delay so user sees feedback and browser doesn't block async event
        setTimeout(() => {
          redirectToWhatsApp(whatsappUrl);
        }, 300);
      }

      return true;
    } catch (err) {
      console.error('Erro ao submeter lead:', err);
      showToast('Ocorreu um erro ao salvar suas informações. Tente novamente.', 'error');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [values, options]);

  const resetForm = useCallback(() => {
    setValues({ name: '', link: '', areaRole: '' });
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setIsSuccess(false);
    setRedirectUrl(null);
  }, []);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isSuccess,
    redirectUrl,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setValues,
  };
}
