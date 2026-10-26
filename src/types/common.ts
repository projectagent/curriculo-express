export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
  durationMs?: number;
}

export interface FormValidationErrors {
  name?: string;
  link?: string;
  areaRole?: string;
  phone?: string;
}
