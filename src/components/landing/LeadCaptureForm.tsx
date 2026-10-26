import React from 'react';
import { useLeadForm } from '../../hooks/useLeadForm';
import { Button } from '../common/Button';
import { WhatsAppIcon, AlertCircleIcon, ExternalLinkIcon, CheckIcon } from '../common/Icons';
import { APP_CONFIG } from '../../config/constants';

export const LeadCaptureForm: React.FC = () => {
  const {
    values,
    errors,
    touched,
    isSubmitting,
    isSuccess,
    redirectUrl,
    handleChange,
    handleBlur,
    handleSubmit,
  } = useLeadForm();

  return (
    <div id="formulario" className="w-full max-w-xl mx-auto bg-white rounded-2xl border border-slate-200/90 shadow-xl p-6 sm:p-10 relative overflow-hidden">
      {/* Decorative top bar */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-navy-700 via-navy-900 to-whatsapp" />

      <div className="mb-8">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-whatsapp-dark bg-whatsapp-surface px-2.5 py-1 rounded-md mb-2">
          <WhatsAppIcon className="w-3.5 h-3.5 text-whatsapp" />
          Atendimento Direto & Ágil
        </span>
        <h3 className="text-2xl font-extrabold text-navy-900 tracking-tight">
          Solicitar Revisão Express
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          Preencha os dados abaixo para darmos início imediato à análise do seu perfil.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Campo: Nome Completo */}
        <div>
          <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Nome Completo <span className="text-rose-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Ex: Mariana Souza"
            value={values.name}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            className={`w-full px-4 py-3 rounded-lg border text-sm text-gray-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
              touched.name && errors.name
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/30'
                : 'border-slate-300 focus:border-navy-700 focus:ring-navy-100 bg-white'
            }`}
          />
          {touched.name && errors.name && (
            <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
              <AlertCircleIcon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{errors.name}</span>
            </p>
          )}
        </div>

        {/* Campo: Link do LinkedIn ou Currículo */}
        <div>
          <label htmlFor="link" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Link do LinkedIn ou Currículo <span className="text-rose-500">*</span>
          </label>
          <input
            id="link"
            name="link"
            type="text"
            required
            placeholder="Ex: linkedin.com/in/seuperfil ou link público do Drive"
            value={values.link}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            className={`w-full px-4 py-3 rounded-lg border text-sm text-gray-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
              touched.link && errors.link
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/30'
                : 'border-slate-300 focus:border-navy-700 focus:ring-navy-100 bg-white'
            }`}
          />
          {touched.link && errors.link && (
            <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
              <AlertCircleIcon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{errors.link}</span>
            </p>
          )}
        </div>

        {/* Campo: Área de Atuação e Cargo Desejado */}
        <div>
          <label htmlFor="areaRole" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
            Área de Atuação e Cargo Desejado <span className="text-rose-500">*</span>
          </label>
          <input
            id="areaRole"
            name="areaRole"
            type="text"
            required
            placeholder="Ex: Desenvolvedor Frontend React Júnior ou QA Automation"
            value={values.areaRole}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isSubmitting}
            className={`w-full px-4 py-3 rounded-lg border text-sm text-gray-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
              touched.areaRole && errors.areaRole
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/30'
                : 'border-slate-300 focus:border-navy-700 focus:ring-navy-100 bg-white'
            }`}
          />
          {touched.areaRole && errors.areaRole && (
            <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
              <AlertCircleIcon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{errors.areaRole}</span>
            </p>
          )}
        </div>

        {/* Submit button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="whatsapp"
            size="lg"
            isLoading={isSubmitting}
            className="w-full text-base py-4 font-bold rounded-xl tracking-tight shadow-md"
            leftIcon={<WhatsAppIcon className="w-5 h-5" />}
          >
            {APP_CONFIG.hero.ctaButton}
          </Button>
        </div>

        <p className="text-[11px] text-center text-slate-400 leading-tight">
          Ao clicar, seus dados serão registrados e você será redirecionado para o WhatsApp com mensagem pré-configurada.
        </p>

        {/* Success Fallback / Manual Open Banner */}
        {isSuccess && redirectUrl && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <CheckIcon className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span className="text-sm font-semibold">Dados salvos com sucesso!</span>
            </div>
            <p className="text-xs text-emerald-800">
              Caso seu navegador tenha bloqueado a abertura automática, clique no botão abaixo para continuar:
            </p>
            <a
              href={redirectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-whatsapp hover:bg-whatsapp-hover text-white text-xs font-bold rounded-lg shadow-sm transition-colors mt-1"
            >
              <WhatsAppIcon className="w-4 h-4" />
              Abrir Conversa no WhatsApp
              <ExternalLinkIcon className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </form>
    </div>
  );
};
