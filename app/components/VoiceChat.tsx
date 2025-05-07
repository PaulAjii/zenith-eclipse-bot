import Image from "next/image"

import { useState } from "react";

  interface ChatModalProps {
    onClose: () => void;
  }

  const VoiceChat = ({onClose}: ChatModalProps) => {
    const [isCalling, setIsCalling] = useState(false)

    const handleCallStart = () => {
        setIsCalling(true)
    }

    const handleCallEnd = () => {
        setIsCalling(false)
    }

    return (
      <div className="modal-overlay">
        <div className="chat-modal">
            <div className="modal-header">
                <div className="modal-title-container">
                <Image 
                    src="/logo.svg" 
                    alt="Zenith Eclipse Logo" 
                    width={30} 
                    height={30}
                    className="modal-logo"
                    onError={(e) => {
                    // Fallback if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    }}
                />
                <p className="modal-title">Zenith Eclipse Call</p>
                </div>
                <button 
                className="close-button" 
                onClick={onClose}
                aria-label="Close chat"
                >
                &times;
                </button>
            </div>

            <div className="call__container">
                {
                    isCalling ? (
                        <>
                        <div className="ai__speaking">
                            <Image src="/logo.svg" alt="Zenith Eclipse Logo" width={1000} height={1000} />

                            <em>Click the End call button to end call with the Bot.</em>
                        </div>
                        <button className="call__btn end" onClick={handleCallEnd}>End Call</button></>
                    ) : (
                    <>
                        <div className="ai__speaking">
                            <Image src="/logo.svg" alt="Zenith Eclipse Logo" width={1000} height={1000} />

                            <em>Click the Call button to start call with the Bot.</em>
                        </div>
                        <button className="call__btn" onClick={handleCallStart}>Call</button>
                    </>
                )
                } 
            </div>
        </div>
        </div>
    );
  };
  
  export default VoiceChat;