import { useState } from 'react';

interface ActionButtonsProps {
  onClearChat: () => void;
  onExportChat: () => void;
  isLoading: boolean;
}

const ActionButtons = ({ onClearChat, onExportChat, isLoading }: ActionButtonsProps) => {
  const [showConfirm, setShowConfirm] = useState(false);
  
  const handleClearClick = () => {
    if (showConfirm) {
      onClearChat();
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
    }
  };
  
  const handleCancelClear = () => {
    setShowConfirm(false);
  };
  
  const handleExportClick = () => {
    onExportChat();
  };
  
  return (
    <div className="action__btns">
      {showConfirm ? (
        <>
          <button 
            onClick={handleClearClick} 
            className="action__btn confirm"
            disabled={isLoading}
          >
            Confirm Clear
          </button>
          <button 
            onClick={handleCancelClear} 
            className="action__btn cancel"
            disabled={isLoading}
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <button 
            onClick={handleClearClick} 
            className="action__btn clear"
            disabled={isLoading}
          >
            Clear Chat
          </button>
          <button 
            onClick={handleExportClick} 
            className="action__btn export"
            disabled={isLoading}
          >
            Export Chat
          </button>
        </>
      )}
    </div>
  );
};

export default ActionButtons; 