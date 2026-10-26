import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="max-w-md mx-auto">
          <span className="text-5xl font-extrabold text-navy-900 mb-2 block">404</span>
          <h1 className="text-2xl font-bold text-navy-900 mb-3">Página não encontrada</h1>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            O endereço que você tentou acessar não existe ou foi movido.
          </p>
          <Link to="/">
            <Button variant="primary">Voltar para o Início</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
};
