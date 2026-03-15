import { createContext, useContext, useState, useCallback } from "react";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = "info", options = {}) => {
    const { title, duration = 4000, dismissible = true } = options;
    const id = Date.now() + Math.random();

    const newNotification = { id, message, type, title, duration, dismissible };
    setNotifications((prev) => [...prev, newNotification]);

    if (duration > 0) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const success = useCallback((message, options = {}) => 
    addNotification(message, "success", options), [addNotification]);
  
  const error = useCallback((message, options = {}) => 
    addNotification(message, "error", options), [addNotification]);
  
  const warning = useCallback((message, options = {}) => 
    addNotification(message, "warning", options), [addNotification]);
  
  const info = useCallback((message, options = {}) => 
    addNotification(message, "info", options), [addNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearAll, success, error, warning, info }}>
      {children}
      <NotificationContainer notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  );
}

function NotificationContainer({ notifications, onRemove }) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-sm">
      {notifications.map((notification, index) => (
        <NotificationItem 
          key={notification.id} 
          notification={notification} 
          onRemove={onRemove}
          index={index}
        />
      ))}
    </div>
  );
}

function NotificationItem({ notification, onRemove, index }) {
  const typeStyles = {
    success: "bg-cyan-50 border-cyan-200 text-cyan-800",
    error: "bg-red-50 border-red-200 text-red-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };

  const icons = {
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const iconColors = {
    success: "text-cyan-600",
    error: "text-red-600",
    warning: "text-amber-600",
    info: "text-blue-600",
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg border shadow-sm ${typeStyles[notification.type]} flex items-start gap-3 animate-slide-in`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <span className={iconColors[notification.type]}>{icons[notification.type]}</span>
      <div className="flex-1 min-w-0">
        {notification.title && (
          <p className="font-medium text-sm mb-0.5">{notification.title}</p>
        )}
        <p className="text-sm">{notification.message}</p>
      </div>
      {notification.dismissible && (
        <button
          onClick={() => onRemove(notification.id)}
          className="text-current opacity-50 hover:opacity-100 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
      <style>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in { animation: slide-in 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotification must be within NotificationProvider");
  return context;
}
