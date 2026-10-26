import React from 'react';
import { LeadCaptureForm } from './LeadCaptureForm';
import { SparklesIcon, CheckIcon, ClockIcon } from '../common/Icons';
import { APP_CONFIG } from '../../config/constants';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-navy-950 via-navy-900 to-navy-800 text-white pt-12 pb-20 lg:pt-20 lg:pb-28">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-navy-700/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-whatsapp/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Copy & Value Proposition */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-whatsapp mb-6">
              <SparklesIcon className="w-3.5 h-3.5" />
              <span>Aceleração de Carreira Tech com Inteligência e Estratégia</span>
            </div>

            {/* Exact Required Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.15] mb-6">
              {APP_CONFIG.hero.title}
            </h1>

            {/* Subtitle with fast turnaround */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mb-8">
              {APP_CONFIG.hero.subtitle}
            </p>

            {/* Quick Proof Bullets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-xl text-sm text-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-whatsapp/20 text-whatsapp flex items-center justify-center flex-shrink-0">
                  <CheckIcon className="w-3.5 h-3.5" />
                </div>
                <span>Adequação completa a filtros ATS</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-whatsapp/20 text-whatsapp flex items-center justify-center flex-shrink-0">
                  <CheckIcon className="w-3.5 h-3.5" />
                </div>
                <span>Otimização estratégica de LinkedIn</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-whatsapp/20 text-whatsapp flex items-center justify-center flex-shrink-0">
                  <ClockIcon className="w-3.5 h-3.5" />
                </div>
                <span>Retorno em poucas horas</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-whatsapp/20 text-whatsapp flex items-center justify-center flex-shrink-0">
                  <CheckIcon className="w-3.5 h-3.5" />
                </div>
                <span>Alinhamento direto via WhatsApp</span>
              </div>
            </div>
          </div>

          {/* Right Column: High Conversion Lead Capture Form */}
          <div className="lg:col-span-5 w-full">
            <LeadCaptureForm />
          </div>
        </div>
      </div>
    </section>
  );
};
