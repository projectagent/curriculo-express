import React, { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { LockIcon, AlertCircleIcon } from '../common/Icons';
import { Button } from '../common/Button';
import { getAdminPassword } from '../../config/env';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export const ADMIN_AUTH_SESSION_KEY = 'admin_authenticated';

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password.trim()) {
      setError('Por favor, informe a senha de administrador.');
      return;
    }

    setIsSubmitting(true);

    const validPassword = getAdminPassword();
    if (password === validPassword) {
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          window.sessionStorage.setItem(ADMIN_AUTH_SESSION_KEY, 'true');
        }
      } catch (err) {
        console.warn('Erro ao salvar sessão de autenticação:', err);
      }
      setIsSubmitting(false);
      onLoginSuccess();
    } else {
      setIsSubmitting(false);
      setError('Senha incorreta. Verifique e tente novamente.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto my-12 bg-white rounded-2xl border border-slate-200/90 shadow-xl p-6 sm:p-8 relative overflow-hidden">
      {/* Decorative top bar */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-navy-800 to-navy-950" />

      <div className="text-center mb-6 pt-2">
        <div className="w-12 h-12 rounded-xl bg-navy-50 border border-navy-100 flex items-center justify-center mx-auto mb-3 text-navy-800">
          <LockIcon className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-navy-900 tracking-tight">
          Acesso Restrito
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Informe a Senha de Administrador para acessar a gestão de leads
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label
            htmlFor="admin-password"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5"
          >
            Senha de Administrador <span className="text-rose-500">*</span>
          </label>
          <input
            id="admin-password"
            name="admin-password"
            type="password"
            required
            autoFocus
            placeholder="Digite a senha de administrador..."
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            disabled={isSubmitting}
            className={`w-full px-4 py-3 rounded-lg border text-sm text-gray-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 ${
              error
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200 bg-rose-50/30'
                : 'border-slate-300 focus:border-navy-700 focus:ring-navy-100 bg-white'
            }`}
          />
          {error && (
            <p className="mt-1.5 text-xs text-rose-600 flex items-center gap-1">
              <AlertCircleIcon className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error}</span>
            </p>
          )}
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            className="w-full text-sm py-3 font-bold rounded-xl shadow-md"
          >
            Acessar Painel
          </Button>
        </div>

        <div className="text-center pt-2">
          <Link
            to="/"
            className="text-xs font-medium text-slate-500 hover:text-navy-900 transition-colors"
          >
            ← Voltar para a Landing Page
          </Link>
        </div>
      </form>
    </div>
  );
};
