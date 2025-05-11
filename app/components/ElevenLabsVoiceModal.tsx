import { useEffect, useRef } from 'react';
import ModalHeader from './ModalHeader';

interface ElevenLabsVoiceModalProps {
  onClose: () => void;
  userInfo: {
    fullname: string;
    email: string;
    phone?: string;
  };
}

const AGENT_ID = 'q7i77JRrMBcBO8sHiKjN';

export default function ElevenLabsVoiceModal({ onClose, userInfo }: ElevenLabsVoiceModalProps) {
  const widgetContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clean up any previous widget
    if (widgetContainerRef.current) {
      widgetContainerRef.current.innerHTML = '';
    }
    // Create the widget element
    const widget = document.createElement('elevenlabs-convai');
    widget.setAttribute('agent-id', AGENT_ID);
    widget.setAttribute('dynamic-variables', JSON.stringify({ fullname: userInfo.fullname }));
    widget.style.width = '100%';
    widget.style.minHeight = '400px';
    widgetContainerRef.current?.appendChild(widget);

    // Inject the script if not already present
    if (!document.getElementById('elevenlabs-widget-script')) {
      const script = document.createElement('script');
      script.src = 'https://elevenlabs.io/convai-widget/index.js';
      script.async = true;
      script.type = 'text/javascript';
      script.id = 'elevenlabs-widget-script';
      document.body.appendChild(script);
    }
  }, [userInfo.fullname]);

  return (
    <div className="modal-overlay">
      <div className="chat-modal" style={{ maxWidth: 420, minHeight: 480 }}>
        <ModalHeader onClose={onClose} />
        <div ref={widgetContainerRef} style={{ width: '100%', minHeight: 400, marginTop: 16 }} />
      </div>
    </div>
  );
} 