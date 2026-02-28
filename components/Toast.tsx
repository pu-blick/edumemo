import React, { useContext } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { ToastContext, ToastType } from '../hooks/useToast';

const STYLES: Record<ToastType, { bg: string; icon: React.ReactNode }> = {
  success: { bg: 'bg-emerald-600', icon: <CheckCircle size={16} /> },
  error:   { bg: 'bg-rose-600',    icon: <AlertCircle size={16} /> },
  warning: { bg: 'bg-amber-500',   icon: <AlertTriangle size={16} /> },
  info:    { bg: 'bg-slate-800',   icon: <Info size={16} /> },
};

const Toast: React.FC = () => {
  const ctx = useContext(ToastContext);
  if (!ctx || !ctx.toast.visible) return null;

  const { bg, icon } = STYLES[ctx.toast.type];

  return (
    <div className={`fixed top-5 right-5 z-[9999] flex items-center gap-2.5 ${bg} text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg animate-slide-up max-w-xs`}>
      {icon}
      <span>{ctx.toast.message}</span>
    </div>
  );
};

export default Toast;
