/**
 * Toast Component
 * Displays a temporary notification message (success / error / warning).
 * Auto-dismisses after 3 seconds.
 */
import React, { useEffect } from 'react';

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>{message}</div>
  );
}

export default Toast;
