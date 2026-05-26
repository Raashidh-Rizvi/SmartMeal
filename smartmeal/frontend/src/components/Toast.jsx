import React, { useState, useEffect } from 'react';
import './Toast.css'; // We will create this just in case

export function ToastItem({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast-alert toast-${type}`} onClick={onClose}>
      {message}
    </div>
  );
}

export default function Toast(props) {
  // If called directly with message/type, behave like old Toast for backwards compatibility
  if (props.message) {
    return <ToastItem {...props} />;
  }

  // Act as a global container listening to events
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleToast = (e) => {
      const { type, message } = e.detail;
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, type, message }]);
    };

    window.addEventListener('app-toast', handleToast);
    return () => window.removeEventListener('app-toast', handleToast);
  }, []);

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  if (toasts.length === 0) return null;

  return (
    <div className="global-toast-container">
      {toasts.map(t => (
        <ToastItem key={t.id} type={t.type} message={t.message} onClose={() => removeToast(t.id)} />
      ))}
    </div>
  );
}
