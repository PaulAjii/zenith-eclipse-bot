'use client';

interface NotificationModalProps {
  title: string;
  message: string;
  onClose: () => void;
}

const NotificationModal = ({ title, message, onClose }: NotificationModalProps) => {
  return (
    <div className="notification-overlay" onClick={onClose}>
      <div 
        className="notification-modal"
        onClick={(e) => e.stopPropagation()} 
      >
        <div className="notification-header">
          <h3>{title}</h3>
          <button 
            className="close-button"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <div className="notification-content">
          <p>{message}</p>
        </div>
        <div className="notification-footer">
          <button 
            className="notification-button"
            onClick={onClose}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal; 