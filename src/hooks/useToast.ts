import { useState, useEffect, useCallback } from 'react';
import { ToastMessage, ToastType } from '../types/common';

type ToastListener = (toasts: ToastMessage[]) => void;

let activeToasts: ToastMessage[] = [];
const listeners: Set<ToastListener> = new Set();

function notifyListeners() {
  listeners.forEach((listener) => listener([...activeToasts]));
}

export function showToast(message: string, type: ToastType = 'info', title?: string, durationMs = 3500) {
  const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newToast: ToastMessage = { id, message, type, title, durationMs };

  activeToasts = [...activeToasts, newToast];
  notifyListeners();

  if (durationMs > 0) {
    setTimeout(() => {
      dismissToast(id);
    }, durationMs);
  }

  return id;
}

export function dismissToast(id: string) {
  activeToasts = activeToasts.filter((t) => t.id !== id);
  notifyListeners();
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>(activeToasts);

  useEffect(() => {
    const listener: ToastListener = (updated) => setToasts(updated);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const toastSuccess = useCallback((msg: string, title?: string) => showToast(msg, 'success', title), []);
  const toastError = useCallback((msg: string, title?: string) => showToast(msg, 'error', title), []);
  const toastInfo = useCallback((msg: string, title?: string) => showToast(msg, 'info', title), []);
  const toastWarning = useCallback((msg: string, title?: string) => showToast(msg, 'warning', title), []);

  return {
    toasts,
    showToast,
    dismissToast,
    toastSuccess,
    toastError,
    toastInfo,
    toastWarning,
  };
}
