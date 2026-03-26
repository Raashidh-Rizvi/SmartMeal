const dispatch = (type, message) => {
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { type, message } }));
};

export const notify = {
  success: (message) => dispatch('success', message),
  error: (message) => dispatch('error', message),
  warning: (message) => dispatch('warning', message),
  info: (message) => dispatch('info', message),
};

export const notifyWithPush = (type, message, pushTitle, pushBody) => {
  notify[type](message);
  if (pushTitle && 'Notification' in window && Notification.permission === 'granted') {
    new Notification(pushTitle, { body: pushBody || message });
  }
};

export const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};
