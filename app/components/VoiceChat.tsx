import Image from "next/image"
import ModalHeader from "./ModalHeader";

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
            <ModalHeader onClose={onClose}  />

            <div className="call__container">
                {
                    isCalling ? (
                        <>
                        <div className="ai__speaking">
                            <Image 
                                src="/images/Zenith-Eclipse-Logo.webp" 
                                alt="Zenith Eclipse Logo" 
                                width={1000} 
                                height={1000} 
                            />

                            <em>Click the End call button to end call with the Bot.</em>
                        </div>
                        <button className="call__btn end" onClick={handleCallEnd}>End Call</button></>
                    ) : (
                    <>
                        <div className="ai__speaking">
                            <Image 
                                src="/images/Zenith-Eclipse-Logo.webp" 
                                alt="Zenith Eclipse Logo" 
                                width={1000} 
                                height={1000} 
                            />

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