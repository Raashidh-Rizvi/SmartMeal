<<<<<<< HEAD
/**
 * Toast Component
 * Displays a temporary notification message (success / error / warning).
 * Auto-dismisses after 3 seconds.
 */
import React, { useEffect } from 'react';

function Toast({ message, type, onClose }) {
=======
import React, { useState, useEffect } from 'react';
import './Toast.css'; // We will create this just in case

export function ToastItem({ message, type, onClose }) {
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
<<<<<<< HEAD
    <div className={`toast toast-${type}`}>{message}</div>
  );
}

export default Toast;
=======
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
>>>>>>> dc84f03c8a83754d8e5b2f9f50379c2d4a5e20d1
