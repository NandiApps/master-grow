import { useState } from 'react';
import '../styles/AlertToast.css';

export interface Toast {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'alert';
  duration?: number; // ms, default 4000
}

interface AlertToastProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

export function AlertToast({ toasts, onDismiss }: AlertToastProps) {
  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast toast-${toast.severity}`}
          role="alert"
        >
          <span className="toast-icon">
            {toast.severity === 'alert' && '⚠️'}
            {toast.severity === 'warning' && '⚡'}
            {toast.severity === 'info' && 'ℹ️'}
          </span>
          <span className="toast-message">{toast.message}</span>
          <button
            className="toast-close"
            onClick={() => onDismiss(toast.id)}
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// Hook for managing toast notifications
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, severity: 'info' | 'warning' | 'alert' = 'info', duration = 4000) => {
    const id = Date.now().toString();
    const toast: Toast = { id, message, severity, duration };
    setToasts(prev => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return { toasts, addToast, dismissToast };
}
