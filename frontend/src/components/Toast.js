import React, { useEffect } from 'react';
import './Toast.css';

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, duration);
    
    return () => {
      clearTimeout(timer);
    };
  }, [duration, onClose]);

  return (
    <div className={`toast-notification ${type}`}>
      <div className="toast-icon">
        {type === 'error' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'}
      </div>
      <div className="toast-message">{message}</div>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
};

export default Toast;