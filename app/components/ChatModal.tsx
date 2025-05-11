'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Message } from 'ai';
import ChatBubble from './ChatBubble';
import LoadingBubble from './LoadingBubble';
import ActionButtons from './ActionButtons';
import NotificationModal from './NotificationModal';
import { v4 as uuidv4 } from 'uuid';

interface ChatModalProps {
  onClose: () => void;
  userInfo: {
    fullname: string;
    email: string;
    phone?: string;
  };
}

// Define error types for better error handling
type ErrorType = 'network' | 'server' | 'input' | 'timeout' | 'unknown';

interface ErrorState {
  show: boolean;
  type: ErrorType;
  message: string;
}

const ChatModal = ({ onClose, userInfo }: ChatModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string>(() => uuidv4());
  const [error, setError] = useState<ErrorState>({
    show: false,
    type: 'unknown',
    message: ''
  });
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const welcomeMessageRef = useRef<HTMLDivElement>(null);
  const MAX_INPUT_LENGTH = 500;

  // Focus input field on mount and ensure welcome message is visible
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    // Make sure welcome message is visible when modal first opens
    if (welcomeMessageRef.current && chatContainerRef.current) {
      welcomeMessageRef.current.scrollIntoView({ block: 'start', behavior: 'auto' });
    }
  }, []);

  // Improved scroll behavior to show new messages without scrolling to bottom
  useEffect(() => {
    // Only scroll if we have messages or are loading
    if (messages.length > 0 || isLoading) {
      // If loading, scroll to show the loading indicator
      if (isLoading && chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      } 
      // If we have a last message reference, scroll to it
      else if (lastMessageRef.current) {
        lastMessageRef.current.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    }
  }, [messages, isLoading]);

  // --- NEW: Scroll to bottom as assistant message streams ---
  useEffect(() => {
    if (!chatContainerRef.current) return;
    // Find the last assistant message
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === 'assistant') {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0 && userInfo) {
      // Greet the user by name as the first assistant message
      setMessages([
        {
          role: 'assistant',
          content: `Hello, ${userInfo.fullname}! I'm your Zenith Eclipse assistant. How can I help you today?`,
          id: 'greeting',
        },
      ]);
    }
  }, [userInfo]);

  // Validate input
  const validateInput = (text: string): { valid: boolean; message: string } => {
    if (!text.trim()) {
      return { valid: false, message: 'Please enter a message.' };
    }
    
    if (text.length > MAX_INPUT_LENGTH) {
      return { 
        valid: false, 
        message: `Message is too long. Please limit to ${MAX_INPUT_LENGTH} characters.` 
      };
    }
    
    return { valid: true, message: '' };
  };

  const handleSubmit = async (e: React.FormEvent, prompt: string) => {
    try {
      e.preventDefault();
      
      // Validate input
      const validation = validateInput(prompt);
      if (!validation.valid) {
        setError({
          show: true,
          type: 'input',
          message: validation.message
        });
        return;
      }
      
      // Don't submit if already loading
      if (isLoading) return;
      
      setIsLoading(true);
      const newMessage: Message = {
        role: 'user',
        content: prompt,
        id: String(Date.now()),
      };
      setMessages((prev) => [...prev, newMessage]);
      setInput(''); // Clear input immediately for better UX

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt.trim(),
            sessionId: sessionId,
            userInfo: userInfo,
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `Server error: ${res.status}`);
        }

        const data = await res.json();

        // Update session ID if returned from server
        if (data.sessionId) {
          setSessionId(data.sessionId);
        }

        // Streaming effect: add empty assistant message, then reveal it character by character
        const assistantId = String(Date.now() + 1);
        setMessages((prev) => [
          ...prev,
          {
          role: 'assistant',
            content: '',
            id: assistantId,
          },
        ]);

        // Streaming logic
        const fullMessage = data.message || '';
        let currentIndex = 0;
        const streamSpeed = 1; // ms per character (adjust for faster/slower effect)

        function streamNextChar() {
          currentIndex++;
          setMessages((prev) => {
            // Only update the last assistant message
            return prev.map((msg, idx) =>
              idx === prev.length - 1 && msg.id === assistantId
                ? { ...msg, content: fullMessage.slice(0, currentIndex) }
                : msg
            );
          });
          if (currentIndex < fullMessage.length) {
            setTimeout(streamNextChar, streamSpeed);
          }
        }
        if (fullMessage.length > 0) {
          setTimeout(streamNextChar, streamSpeed);
        }
      } catch (error) {
        let errorType: ErrorType = 'unknown';
        let errorMessage = "I'm sorry, I couldn't process your request. Please try again.";
        
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            errorType = 'timeout';
            errorMessage = "The request took too long to process. Please try again or try a shorter message.";
          } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
            errorType = 'network';
            errorMessage = "Couldn't connect to the server. Please check your internet connection and try again.";
          } else if (error.message.includes('Server error')) {
            errorType = 'server';
            errorMessage = "There was a problem on our server. Our team has been notified and we're working on it.";
          }
        }
        
        // Show error in chat
        setMessages((prev) => [...prev, {
          role: 'assistant',
          content: errorMessage,
          id: 'error-' + Date.now(),
        }]);
        
        // Also show notification for network/server errors
        if (errorType === 'network' || errorType === 'server' || errorType === 'timeout') {
          setError({
            show: true,
            type: errorType,
            message: errorMessage
          });
        }
      }
    } catch (err) {
      console.error('Chat submission error:', err);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: "Something unexpected happened. Please try again later.",
        id: 'error-' + Date.now(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    // Don't reset sessionId to maintain conversation context with server
  };

  const handleExportChat = () => {
    try {
      // Format messages for export
      const chatContent = messages.map(msg => 
        `${msg.role === 'user' ? 'You' : 'Assistant'}: ${msg.content}`
      ).join('\n\n');
      
      // Create and download file
      const blob = new Blob([chatContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `zenith-eclipse-chat-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      setError({
        show: true,
        type: 'unknown',
        message: "Couldn't export chat. Please try again."
      });
    }
  };

  const closeErrorModal = () => {
    setError({ ...error, show: false });
  };

  return (
    <div className="modal-overlay">
      <div className="chat-modal">
        <div className="modal-header">
          <div className="modal-title-container">
            <Image 
              src="/images/Zenith-Eclipse-Logo.webp" 
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
            <p className="modal-title">Zenith Eclipse Chat</p>
          </div>
          <button 
            className="close-button" 
            onClick={onClose}
            aria-label="Close chat"
          >
            &times;
          </button>
        </div>
        
        <div className="chat__container modal-chat" ref={chatContainerRef}>
          {messages.map((message, index) => (
            <div 
              key={`message-${index}`}
              ref={index === messages.length - 1 ? lastMessageRef : undefined}
            >
              <ChatBubble
                content={message.content}
                role={message.role}
              />
            </div>
          ))}
          {isLoading && <LoadingBubble />}
        </div>
        
        <div className="input__container modal-input">
          <form onSubmit={(e) => handleSubmit(e, input)}>
            <textarea
              ref={inputRef}
              placeholder="Ask me anything..."
              className="input__field"
              autoComplete="off"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              maxLength={MAX_INPUT_LENGTH}
              aria-label="Chat input"
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                // Reset height to auto to accurately calculate new height
                target.style.height = 'auto';
                // Set new height based on scrollHeight with a small buffer
                target.style.height = `${target.scrollHeight}px`;
              }}
            />
            <div className="input-info">
              {input.length > 0 && (
                <span className={`character-count ${input.length > MAX_INPUT_LENGTH * 0.8 ? 'warning' : ''}`}>
                  {input.length}/{MAX_INPUT_LENGTH}
                </span>
              )}
            </div>
            <button
              type="submit"
              className={`submit__button ${isLoading || !input.trim() ? 'disabled' : ''}`}
              disabled={isLoading || !input.trim()}
              aria-label="Send message"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>

          <ActionButtons 
            onClearChat={handleClearChat}
            onExportChat={handleExportChat}
            isLoading={isLoading}
          />
        </div>
      </div>

      {error.show && (
        <NotificationModal
          title={error.type === 'input' ? 'Input Error' : 'Connection Error'}
          message={error.message}
          onClose={closeErrorModal}
        />
      )}
    </div>
  );
};

export default ChatModal; 