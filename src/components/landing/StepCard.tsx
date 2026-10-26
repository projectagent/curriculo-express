import React from 'react';

interface StepCardProps {
  number: number;
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export const StepCard: React.FC<StepCardProps> = ({ number, title, description, icon }) => {
  return (
    <div className="relative flex flex-col p-6 sm:p-8 bg-white rounded-2xl border border-slate-200/80 shadow-card hover:shadow-lg transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <span className="w-10 h-10 rounded-xl bg-navy-50 text-navy-900 border border-navy-100 flex items-center justify-center font-extrabold text-base">
          {number}
        </span>
        {icon && <div className="text-whatsapp">{icon}</div>}
      </div>

      <h3 className="text-lg font-bold text-navy-900 mb-2 leading-snug">
        {title}
      </h3>

      <p className="text-sm text-slate-600 leading-relaxed">
        {description}
      </p>
    </div>
  );
};
