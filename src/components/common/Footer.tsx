import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheckIcon, ClockIcon, SparklesIcon } from './Icons';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy-950 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 pb-10 border-b border-slate-800/80">
          {/* Brand info */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-navy-800 flex items-center justify-center text-whatsapp">
                <SparklesIcon className="w-4 h-4" />
              </div>
              <span className="font-bold text-white text-base">
                Currículo<span className="text-whatsapp">Express</span> Tech
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Revisão profissional de currículos e perfis do LinkedIn focada em transição e aceleração de carreira na área de tecnologia.
            </p>
          </div>

          {/* Trust points */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Garantias</h4>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ClockIcon className="w-4 h-4 text-whatsapp" />
              <span>Entrega ágil em poucas horas</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <ShieldCheckIcon className="w-4 h-4 text-whatsapp" />
              <span>Diagnóstico compatível com algoritmos ATS</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-whatsapp" />
              <span>Atendimento personalizado direto no WhatsApp</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Acesso Rápido</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <a href="#formulario" className="hover:text-white transition-colors">
                  Solicitar Revisão
                </a>
              </li>
              <li>
                <a href="#como-funciona" className="hover:text-white transition-colors">
                  Como Funciona
                </a>
              </li>
              <li>
                <Link to="/admin" className="hover:text-whatsapp transition-colors">
                  Acesso Administrativo (/admin)
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Currículo Express Tech. Todos os direitos reservados.</p>
          <p className="text-slate-500">Desenvolvido com foco em alta conversão e empregabilidade tech.</p>
        </div>
      </div>
    </footer>
  );
};
