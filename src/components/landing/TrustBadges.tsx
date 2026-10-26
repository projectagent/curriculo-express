import React from 'react';
import { ShieldCheckIcon, ClockIcon, SparklesIcon, FileTextIcon } from '../common/Icons';

export const TrustBadges: React.FC = () => {
  const badges = [
    {
      icon: <ClockIcon className="w-5 h-5 text-whatsapp" />,
      title: 'Entrega em poucas horas',
      subtitle: 'Sem esperar dias para aplicar',
    },
    {
      icon: <ShieldCheckIcon className="w-5 h-5 text-whatsapp" />,
      title: 'Compatível com ATS',
      subtitle: 'Palavras-chave que passam filtros',
    },
    {
      icon: <SparklesIcon className="w-5 h-5 text-whatsapp" />,
      title: 'Foco no Mercado Tech',
      subtitle: 'Desenvolvedores, Dados, QA e Design',
    },
    {
      icon: <FileTextIcon className="w-5 h-5 text-whatsapp" />,
      title: 'Metodologia STAR',
      subtitle: 'Resultados e métricas reais de impacto',
    },
  ];

  return (
    <section id="beneficios" className="py-12 bg-white border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {badges.map((badge, idx) => (
            <div key={idx} className="flex items-start gap-3 sm:gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-whatsapp-surface flex items-center justify-center border border-whatsapp/20">
                {badge.icon}
              </div>
              <div>
                <h4 className="text-sm font-bold text-navy-900 leading-tight">
                  {badge.title}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {badge.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
