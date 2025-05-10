import Image from 'next/image';
import ModalHeader from './ModalHeader';
import { useState, useRef } from 'react';
import {
  getToken,
  getSdpResponse,
  getChatResponse,
  getTTSResponse,
} from '@/services/openapi';
import { COMPANY_SYSTEM_PROMPT } from '@/utils/prompts';

interface ChatModalProps {
  onClose: () => void;
}

const VoiceChat = ({ onClose }: ChatModalProps) => {
  const [isCalling, setIsCalling] = useState(false);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  async function init() {
    // Get Ephemeral Token
    const ephemeral = await getToken();

    // Create an RTC peer connection to manage WebRTC Connection
    const peer = new RTCPeerConnection();
    peerRef.current = peer;

    // Create audio element to play the audio stream
    const audioAI = document.createElement('audio');
    audioAI.autoplay = true;
    peer.ontrack = (e) => {
      audioAI.srcObject = e.streams[0];
    };

    // Get audio stream from the user
    const localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    localStreamRef.current = localStream;
    peer.addTrack(localStream.getTracks()[0]);

    // Create a data channel to exchange messages
    const dataChannel = peer.createDataChannel('oai-events');
    dataChannelRef.current = dataChannel;

    // Start the session using the Session Description Protocol (SDP)
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    const sdpResponse = await getSdpResponse(ephemeral, offer);

    const answer = {
      type: 'answer',
      sdp: await sdpResponse.text(),
    };
    await peer.setRemoteDescription(answer as RTCSessionDescriptionInit);

    dataChannel.addEventListener('open', () => {
      setIsCalling(true);
      dataChannel.send(
        JSON.stringify({
          type: 'session.update',
          session: {
            instructions: COMPANY_SYSTEM_PROMPT,
          },
        })
      );
    });

    dataChannel.addEventListener('message', async (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'text') {
        const prompt = data.text;

        const response = await getChatResponse(prompt);
        const responseData = await response.json();
        const botResponse = responseData.message;

        const ttsResponse = await getTTSResponse(ephemeral, botResponse);

        const audioStream = await ttsResponse.blob();
        const audioUrl = URL.createObjectURL(audioStream);
        const audio = new Audio(audioUrl);
        audio.play();
      }
    });
  }

  const handleCallStart = async () => {
    await init();
  };

  const handleCallEnd = () => {
    dataChannelRef.current.close();
    peerRef.current.close();
    localStreamRef.current.getTracks().forEach((track) => {
      track.stop();
    });
    setIsCalling(false);
  };

  return (
    <div className="modal-overlay">
      <div className="chat-modal">
        <ModalHeader onClose={onClose} />

        <div className="call__container">
          {isCalling ? (
            <>
              <div className="ai__speaking active">
                <Image
                  src="/images/Zenith-Eclipse-Logo.webp"
                  alt="Zenith Eclipse Logo"
                  width={1000}
                  height={1000}
                />

                <em>Click the End call button to end call with the Bot.</em>
              </div>
              <button className="call__btn end" onClick={handleCallEnd}>
                End Call
              </button>
            </>
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
              <button className="call__btn" onClick={handleCallStart}>
                Call
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceChat;
