import React from 'react';
import { StepCard } from './StepCard';
import { FileTextIcon, WhatsAppIcon, SparklesIcon } from '../common/Icons';
import { APP_CONFIG } from '../../config/constants';

export const HowItWorksSection: React.FC = () => {
  const icons = [
    <FileTextIcon key="1" className="w-6 h-6 text-navy-700" />,
    <WhatsAppIcon key="2" className="w-6 h-6 text-whatsapp" />,
    <SparklesIcon key="3" className="w-6 h-6 text-amber-500" />,
  ];

  return (
    <section id="como-funciona" className="py-20 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-xs uppercase tracking-wider font-bold text-navy-700 bg-navy-50 px-3 py-1 rounded-full border border-navy-100 mb-3">
            Passo a Passo Simples
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight mb-4">
            {APP_CONFIG.howItWorks.title}
          </h2>
          <p className="text-base text-slate-600">
            {APP_CONFIG.howItWorks.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {APP_CONFIG.howItWorks.steps.map((step, idx) => (
            <StepCard
              key={step.number}
              number={step.number}
              title={step.title}
              description={step.description}
              icon={icons[idx]}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
