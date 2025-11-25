
import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const icons = {
  success: <CheckCircle size={20} className="text-emerald-400" />,
  error: <AlertCircle size={20} className="text-red-400" />,
  warning: <AlertTriangle size={20} className="text-amber-400" />,
  info: <Info size={20} className="text-blue-400" />
};

const bgColors = {
  success: 'bg-emerald-500/10 border-emerald-500/20',
  error: 'bg-red-500/10 border-red-500/20',
  warning: 'bg-amber-500/10 border-amber-500/20',
  info: 'bg-blue-500/10 border-blue-500/20'
};

export const ToastContainer: React.FC<ToastProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto flex items-start gap-3 min-w-[300px] max-w-md p-4 rounded-xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-in slide-in-from-right-full fade-in
            ${bgColors[toast.type]}
          `}
        >
          <div className="mt-0.5 shrink-0">{icons[toast.type]}</div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-100 leading-tight">{toast.message}</p>
          </div>
          <button 
            onClick={() => removeToast(toast.id)}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
};
