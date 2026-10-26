import React from 'react';
import { useToast } from '../../hooks/useToast';
import { CheckIcon, AlertCircleIcon } from './Icons';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <aside
      aria-label="Notificações"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border transition-all duration-300 transform translate-y-0 ${
              isSuccess
                ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
                : isError
                ? 'bg-rose-50 text-rose-950 border-rose-200'
                : isWarning
                ? 'bg-amber-50 text-amber-950 border-amber-200'
                : 'bg-navy-900 text-white border-navy-700'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {isSuccess && <CheckIcon className="w-5 h-5 text-emerald-600" />}
              {isError && <AlertCircleIcon className="w-5 h-5 text-rose-600" />}
              {isWarning && <AlertCircleIcon className="w-5 h-5 text-amber-600" />}
              {!isSuccess && !isError && !isWarning && (
                <div className="w-2.5 h-2.5 rounded-full bg-sky-400 mt-1" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              {toast.title && (
                <h4 className="text-sm font-semibold mb-0.5">{toast.title}</h4>
              )}
              <p className="text-xs sm:text-sm font-normal leading-relaxed break-words">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => dismissToast(toast.id)}
              className="flex-shrink-0 text-slate-400 hover:text-slate-600 p-1 -mr-1 -mt-1 rounded focus:outline-none"
              aria-label="Fechar notificação"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        );
      })}
    </aside>
  );
};
