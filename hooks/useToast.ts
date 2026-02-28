import { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'error' | 'success' | 'warning' | 'info';

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

interface ToastContextValue {
  toast: ToastState;
  showToast: (message: string, type?: ToastType) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToastState(): ToastContextValue {
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'info', visible: false });

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 2500);
  }, []);

  return { toast, showToast };
}

export function useToast(): (message: string, type?: ToastType) => void {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.showToast;
}
