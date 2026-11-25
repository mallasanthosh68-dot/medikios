import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toastOrMessage, type = 'info', duration = 4000) => {
      const id = Date.now() + Math.random().toString(36).substring(2, 9);
      let newToast = { id, type, duration };

      if (typeof toastOrMessage === 'string') {
        newToast.message = toastOrMessage;
      } else if (toastOrMessage && typeof toastOrMessage === 'object') {
        newToast = {
          ...newToast,
          title: toastOrMessage.title,
          message: toastOrMessage.message || toastOrMessage.text,
          type: toastOrMessage.type || type,
          duration: toastOrMessage.duration || duration,
        };
      }

      setToasts((prev) => [...prev, newToast]);

      if (newToast.duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, newToast.duration);
      }

      return id;
    },
    [removeToast]
  );

  const toastHelpers = {
    success: (msg, opts = {}) => addToast(msg, 'success', opts.duration || 4000),
    error: (msg, opts = {}) => addToast(msg, 'error', opts.duration || 5000),
    warning: (msg, opts = {}) => addToast(msg, 'warning', opts.duration || 4500),
    info: (msg, opts = {}) => addToast(msg, 'info', opts.duration || 4000),
  };

  // Expose globally on window for legacy non-hook calls
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.toast = toastHelpers;
    }
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ showToast: addToast, removeToast, toast: toastHelpers }}>
      {children}
      {/* Floating Modern Toast Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.92, transition: { duration: 0.18 } }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className={`pointer-events-auto p-4 rounded-2xl shadow-xl border backdrop-blur-md flex items-start gap-3 transition-all ${
                item.type === 'success'
                  ? 'bg-emerald-50/95 border-emerald-200 text-emerald-950 shadow-emerald-500/10'
                  : item.type === 'error'
                  ? 'bg-rose-50/95 border-rose-200 text-rose-950 shadow-rose-500/10'
                  : item.type === 'warning'
                  ? 'bg-amber-50/95 border-amber-200 text-amber-950 shadow-amber-500/10'
                  : 'bg-white/95 border-[#D9E4E5] text-[#172033] shadow-slate-500/10'
              }`}
            >
              {/* Type Icon */}
              <div className="shrink-0 mt-0.5">
                {item.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                {item.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600" />}
                {item.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600" />}
                {item.type === 'info' && <Info className="w-5 h-5 text-[#0EA5A8]" />}
              </div>

              {/* Text Content */}
              <div className="flex-1 min-w-0 pr-1">
                {item.title && <div className="text-xs font-bold leading-tight mb-0.5">{item.title}</div>}
                <div className="text-xs font-medium leading-relaxed opacity-90">{item.message}</div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => removeToast(item.id)}
                className="shrink-0 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback if used outside provider
    return {
      showToast: () => {},
      removeToast: () => {},
      toast: {
        success: (msg) => (typeof window !== 'undefined' && window.toast?.success ? window.toast.success(msg) : console.log('[Success]', msg)),
        error: (msg) => (typeof window !== 'undefined' && window.toast?.error ? window.toast.error(msg) : console.error('[Error]', msg)),
        warning: (msg) => (typeof window !== 'undefined' && window.toast?.warning ? window.toast.warning(msg) : console.warn('[Warning]', msg)),
        info: (msg) => (typeof window !== 'undefined' && window.toast?.info ? window.toast.info(msg) : console.log('[Info]', msg)),
      },
    };
  }
  return context;
};
