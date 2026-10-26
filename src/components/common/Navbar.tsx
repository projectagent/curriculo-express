import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SparklesIcon } from './Icons';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-2.5 group focus:outline-none">
          <div className="w-10 h-10 rounded-xl bg-navy-900 flex items-center justify-center text-white shadow-sm group-hover:bg-navy-800 transition-colors">
            <SparklesIcon className="w-5 h-5 text-whatsapp" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-navy-900 text-lg tracking-tight leading-tight">
              Currículo<span className="text-whatsapp">Express</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
              Tech Career Booster
            </span>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="flex items-center gap-4 sm:gap-6">
          {!isAdmin ? (
            <>
              <a
                href="#como-funciona"
                className="hidden md:inline-block text-sm font-medium text-slate-600 hover:text-navy-900 transition-colors"
              >
                Como Funciona
              </a>
              <a
                href="#beneficios"
                className="hidden md:inline-block text-sm font-medium text-slate-600 hover:text-navy-900 transition-colors"
              >
                Diferenciais
              </a>
              <a
                href="#formulario"
                className="hidden sm:inline-flex items-center text-sm font-medium text-navy-900 hover:text-navy-700 transition-colors"
              >
                Solicitar Revisão
              </a>
              <Link
                to="/admin"
                className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors shadow-2xs"
              >
                Painel Admin
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/"
                className="text-sm font-medium text-slate-600 hover:text-navy-900 transition-colors"
              >
                ← Voltar para a Landing Page
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
