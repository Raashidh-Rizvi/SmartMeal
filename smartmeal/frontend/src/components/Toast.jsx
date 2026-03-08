/**
 * Toast Component
 * Displays a temporary notification message (success / error / warning).
 * Auto-dismisses after 3 seconds.
 */

function Toast({ message, type, onClose }) {
  const { useEffect } = React;

  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`toast toast-${type}`}>{message}</div>
  );
}
