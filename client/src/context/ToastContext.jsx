import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const duration = toast.duration ?? 4500;
    const newToast = { ...toast, id, createdAt: Date.now() };

    setToasts((prev) => [...prev.slice(-4), newToast]); // Keep at most 5 toasts

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const toast = {
    success: (message, title = 'Success', options = {}) =>
      addToast({ type: 'success', title, message, ...options }),
    error: (message, title = 'Error', options = {}) =>
      addToast({ type: 'error', title, message, ...options }),
    warning: (message, title = 'Attention', options = {}) =>
      addToast({ type: 'warning', title, message, ...options }),
    info: (message, title = 'Information', options = {}) =>
      addToast({ type: 'info', title, message, ...options }),
    dismiss: removeToast
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast Notification Container */}
      <div
        className="toast-container"
        role="region"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((t) => {
          const Icon =
            t.type === 'success'
              ? CheckCircle
              : t.type === 'error'
              ? AlertCircle
              : t.type === 'warning'
              ? AlertTriangle
              : Info;

          return (
            <div
              key={t.id}
              className={`toast-item toast-${t.type} animate-slide-in`}
              role="alert"
            >
              <div className="toast-icon">
                <Icon size={18} />
              </div>
              <div className="toast-content">
                {t.title && <div className="toast-title">{t.title}</div>}
                <div className="toast-message">{t.message}</div>
              </div>
              <button
                className="toast-close"
                onClick={() => removeToast(t.id)}
                aria-label="Dismiss notification"
              >
                <X size={14} />
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

export default ToastContext;
