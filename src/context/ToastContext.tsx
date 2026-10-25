import React, { createContext, useContext, useState, useCallback, useId } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  toast: {
    success: (message: string, title?: string, duration?: number) => void;
    error: (message: string, title?: string, duration?: number) => void;
    warning: (message: string, title?: string, duration?: number) => void;
    info: (message: string, title?: string, duration?: number) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, title?: string, duration = 4500) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: Toast = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toast = {
    success: (msg: string, title?: string, dur?: number) => showToast('success', msg, title || 'Success', dur),
    error: (msg: string, title?: string, dur?: number) => showToast('error', msg, title || 'Error', dur),
    warning: (msg: string, title?: string, dur?: number) => showToast('warning', msg, title || 'Warning', dur),
    info: (msg: string, title?: string, dur?: number) => showToast('info', msg, title || 'Notice', dur),
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, toast }}>
      {children}
      {/* Toast Notification Container */}
      <div
        aria-live="assertive"
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => {
          const config = {
            success: {
              border: 'border-emerald-500/30 dark:border-emerald-500/20',
              bg: 'bg-white dark:bg-slate-900',
              badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400',
              icon: CheckCircle2,
              titleColor: 'text-emerald-800 dark:text-emerald-300',
              barColor: 'bg-emerald-500',
            },
            error: {
              border: 'border-rose-500/30 dark:border-rose-500/20',
              bg: 'bg-white dark:bg-slate-900',
              badgeBg: 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400',
              icon: AlertCircle,
              titleColor: 'text-rose-800 dark:text-rose-300',
              barColor: 'bg-rose-500',
            },
            warning: {
              border: 'border-amber-500/30 dark:border-amber-500/20',
              bg: 'bg-white dark:bg-slate-900',
              badgeBg: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400',
              icon: AlertTriangle,
              titleColor: 'text-amber-800 dark:text-amber-300',
              barColor: 'bg-amber-500',
            },
            info: {
              border: 'border-blue-500/30 dark:border-blue-500/20',
              bg: 'bg-white dark:bg-slate-900',
              badgeBg: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400',
              icon: Info,
              titleColor: 'text-blue-800 dark:text-blue-300',
              barColor: 'bg-blue-500',
            },
          }[t.type];

          const IconComponent = config.icon;

          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto rounded-2xl shadow-xl shadow-slate-900/10 border ${config.border} ${config.bg} p-4 flex items-start gap-3.5 transition-all duration-300 animate-slide-in relative overflow-hidden backdrop-blur-md`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${config.badgeBg}`}>
                <IconComponent className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0 pr-2">
                {t.title && (
                  <h4 className={`text-sm font-bold tracking-tight mb-0.5 ${config.titleColor}`}>
                    {t.title}
                  </h4>
                )}
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed break-words font-medium">
                  {t.message}
                </p>
              </div>

              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 -mr-1 -mt-1"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
