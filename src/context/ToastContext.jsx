import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import Icon from '../components/Icon';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);

    timersRef.current[id] = setTimeout(() => {
      removeToast(id);
    }, duration);

    return id;
  }, [removeToast]);

  const success = useCallback((msg, duration) => addToast(msg, 'success', duration), [addToast]);
  const error = useCallback((msg, duration) => addToast(msg, 'error', duration), [addToast]);
  const info = useCallback((msg, duration) => addToast(msg, 'info', duration), [addToast]);
  const warning = useCallback((msg, duration) => addToast(msg, 'warning', duration), [addToast]);

  const confirm = useCallback((message) => {
    return new Promise((resolve) => {
      const id = ++toastId;
      setToasts((prev) => [...prev, {
        id,
        message,
        type: 'confirm',
        onConfirm: () => { resolve(true); removeToast(id); },
        onCancel: () => { resolve(false); removeToast(id); },
      }]);
    });
  }, [removeToast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info, warning, confirm }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }) {
  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '80px',
      right: '20px',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxWidth: '380px',
      width: '100%',
      pointerEvents: 'none',
    }}
    className="toast-container"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

const TYPE_STYLES = {
  success: {
    bg: 'rgba(76, 175, 80, 0.12)',
    border: 'rgba(76, 175, 80, 0.4)',
    icon: 'checkCircle',
    color: '#66bb6a',
  },
  error: {
    bg: 'rgba(244, 67, 54, 0.12)',
    border: 'rgba(244, 67, 54, 0.4)',
    icon: 'alertCircle',
    color: '#ef5350',
  },
  info: {
    bg: 'rgba(30, 118, 130, 0.12)',
    border: 'rgba(30, 118, 130, 0.4)',
    icon: 'info',
    color: '#2a9aa8',
  },
  warning: {
    bg: 'rgba(255, 152, 0, 0.12)',
    border: 'rgba(255, 152, 0, 0.4)',
    icon: 'alertTriangle',
    color: '#ffb74d',
  },
};

function ToastItem({ toast, onRemove }) {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 200);
  };

  if (toast.type === 'confirm') {
    return (
      <div style={{
        background: 'var(--toast-bg)',
        border: '1px solid var(--toast-border)',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        pointerEvents: 'auto',
        animation: isExiting ? 'toastExit 0.2s ease forwards' : 'toastEnter 0.3s ease',
        maxWidth: '320px',
      }}>
        <p style={{        color: 'var(--toast-text)', fontSize: '0.875rem', marginBottom: '12px', lineHeight: 1.5 }}>
          {toast.message}
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => { toast.onCancel?.(); }}
            style={{
              padding: '6px 16px',
              background: 'transparent',
              border: '1px solid #2d4155',
              color: '#9aafc4',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => { toast.onConfirm?.(); }}
            style={{
              padding: '6px 16px',
              background: '#d46357',
              border: 'none',
              color: 'white',
              borderRadius: '6px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
    );
  }

  const style = TYPE_STYLES[toast.type] || TYPE_STYLES.info;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      background: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: '10px',
      padding: '10px 14px',
      backdropFilter: 'blur(8px)',
      pointerEvents: 'auto',
      animation: isExiting ? 'toastExit 0.2s ease forwards' : 'toastEnter 0.3s ease',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    }}>
      <span style={{ color: style.color, flexShrink: 0, display: 'flex' }}>
        <Icon name={style.icon} size={18} />
      </span>
      <span style={{ color: 'var(--toast-text)', fontSize: '0.85rem', flex: 1, lineHeight: 1.4 }}>
        {toast.message}
      </span>
      <button
        onClick={handleClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2px',
          flexShrink: 0,
        }}
      >
        <Icon name="close" size={14} />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider');
  }
  return context;
}


