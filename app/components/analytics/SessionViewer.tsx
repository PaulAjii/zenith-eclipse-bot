'use client';

import { useState, useEffect } from 'react';

interface Message {
  timestamp: string;
  role: 'human' | 'assistant';
  content: string;
  category?: string;
  relevanceScore?: number;
  humanAssistanceNeeded?: boolean;
  responseTimeMs?: number;
}

interface SessionDetail {
  sessionId: string;
  interactionCount: number;
  firstInteraction: string;
  lastInteraction: string;
  sessionDurationMs: number;
  avgResponseTimeMs: number;
  conversationFlow: Message[];
}

export default function SessionViewer({ sessionId }: { sessionId: string }) {
  const [sessionData, setSessionData] = useState<SessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSessionData() {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real app, this would be:
        // const res = await fetch(`/api/analytics/session/${sessionId}`);
        
        // For the mockup, we'll generate mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate 5-15 messages for the conversation
        const messageCount = Math.floor(Math.random() * 10) + 5;
        const mockMessages: Message[] = [];
        
        let currentTime = new Date(Date.now() - Math.random() * 86400000);
        
        for (let i = 0; i < messageCount; i++) {
          const isHuman = i % 2 === 0;
          const responseTime = isHuman ? 0 : Math.floor(Math.random() * 3000) + 500;
          
          // If it's a human message, add response time to the previous assistant message
          if (i > 0 && isHuman) {
            const typingTime = Math.floor(Math.random() * 10000) + 2000;
            currentTime = new Date(currentTime.getTime() + typingTime);
          }
          
          mockMessages.push({
            timestamp: currentTime.toISOString(),
            role: isHuman ? 'human' : 'assistant',
            content: isHuman 
              ? getRandomQuestion(i === 0) 
              : getRandomAnswer(),
            ...(isHuman ? {} : {
              category: getRandomCategory(),
              relevanceScore: Math.random(),
              humanAssistanceNeeded: Math.random() < 0.1,
              responseTimeMs: responseTime
            })
          });
          
          // Add response time to the timestamp for the next message
          if (!isHuman) {
            currentTime = new Date(currentTime.getTime() + responseTime);
          }
        }
        
        const sessionDuration = 
          new Date(mockMessages[mockMessages.length - 1].timestamp).getTime() - 
          new Date(mockMessages[0].timestamp).getTime();
        
        const avgResponseTime = mockMessages
          .filter(m => m.role === 'assistant')
          .reduce((sum, m) => sum + (m.responseTimeMs || 0), 0) / 
          mockMessages.filter(m => m.role === 'assistant').length;
        
        const mockSession: SessionDetail = {
          sessionId,
          interactionCount: mockMessages.length,
          firstInteraction: mockMessages[0].timestamp,
          lastInteraction: mockMessages[mockMessages.length - 1].timestamp,
          sessionDurationMs: sessionDuration,
          avgResponseTimeMs: avgResponseTime,
          conversationFlow: mockMessages
        };
        
        setSessionData(mockSession);
      } catch (err) {
        console.error('Failed to fetch session data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchSessionData();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="panel-loading">
        <div className="loading-spinner"></div>
        <p>Loading session data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel-error">
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p>Error loading session data: {error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="panel-empty">
        <p>No data available for this session.</p>
      </div>
    );
  }

  return (
    <div className="session-viewer">
      <div className="session-header">
        <h2>Session: {sessionId.substring(0, 12)}...</h2>
        <div className="session-meta">
          <div className="meta-item">
            <span className="label">First Interaction:</span>
            <span className="value">{new Date(sessionData.firstInteraction).toLocaleString()}</span>
          </div>
          <div className="meta-item">
            <span className="label">Duration:</span>
            <span className="value">{formatDuration(sessionData.sessionDurationMs)}</span>
          </div>
          <div className="meta-item">
            <span className="label">Messages:</span>
            <span className="value">{sessionData.interactionCount}</span>
          </div>
          <div className="meta-item">
            <span className="label">Avg Response:</span>
            <span className="value">{Math.round(sessionData.avgResponseTimeMs)}ms</span>
          </div>
        </div>
      </div>
      
      <div className="conversation-timeline">
        {sessionData.conversationFlow.map((message, index) => (
          <div key={index} className={`chat-message ${message.role}`}>
            <div className="message-header">
              <div className="message-role">
                {message.role === 'human' ? 'User' : 'Assistant'}
              </div>
              <div className="message-time">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
            
            <div className="message-content">
              {message.content}
            </div>
            
            {message.role === 'assistant' && (
              <div className="message-meta">
                {message.category && (
                  <span className="meta-tag category">
                    {message.category}
                  </span>
                )}
                {message.relevanceScore !== undefined && (
                  <span className="meta-tag relevance">
                    Relevance: {(message.relevanceScore * 100).toFixed(0)}%
                  </span>
                )}
                {message.responseTimeMs !== undefined && (
                  <span className="meta-tag response-time">
                    Response: {message.responseTimeMs}ms
                  </span>
                )}
                {message.humanAssistanceNeeded && (
                  <span className="meta-tag human-needed">
                    Human Assistance Needed
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="export-container">
        <button className="export-button">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Export Conversation
        </button>
      </div>
    </div>
  );
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// Helper functions to generate mock data
function getRandomQuestion(isFirst: boolean): string {
  const questions = [
    isFirst ? "Hello, I need information about your agricultural products." : "Can you tell me more about your wheat options?",
    "What logistics services do you offer for international shipping?",
    "Do you have organic options available?",
    "What are your payment terms for bulk orders?",
    "Can you explain the differences between your logistics services?",
    "I'm looking for high-protein wheat. What can you offer?",
    "Do you provide samples before large orders?",
    "What certifications do your agricultural products have?",
    "How do you handle customs clearance?",
    "What's the minimum order quantity for rapeseed oil?",
    "Could you explain your quality control process?",
    "What's the lead time for ocean shipping to Europe?",
    "Do you offer door-to-door delivery?"
  ];
  
  return questions[Math.floor(Math.random() * questions.length)];
}

function getRandomAnswer(): string {
  const answers = [
    "We offer a variety of premium agricultural products including wheat, barley, oats, and various oilseeds. Each product is available in different grades and specifications to meet your specific needs.",
    "Our logistics services include air cargo, ocean freight, rail transport, and truck delivery. We can arrange door-to-door delivery and handle all customs documentation for international shipments.",
    "Yes, we offer organic options for most of our agricultural products. All our organic items are certified and comply with international organic standards.",
    "For bulk orders, we typically offer terms of 30-50% advance payment, with the balance due before shipment. We can also arrange letter of credit payments for international customers.",
    "We have different delivery options depending on your timeline and budget. Air cargo is fastest but more expensive, while ocean freight is more economical for large volumes. Our rail and truck options are ideal for regional deliveries.",
    "Our high-protein wheat varieties contain 13-16% protein content, perfect for bread making and pasta production. We can provide detailed specifications and samples upon request.",
    "We provide comprehensive quality control at every stage of production and logistics. All products undergo testing for quality, moisture content, and compliance with international standards before shipping.",
    "The lead time for ocean shipping to Europe typically ranges from 15-30 days depending on the specific destination port. We can provide more precise estimates based on your exact location.",
    "Yes, we can arrange door-to-door delivery through our integrated logistics network. This includes pickup from our facilities, international shipping, customs clearance, and final delivery to your location."
  ];
  
  return answers[Math.floor(Math.random() * answers.length)];
}

function getRandomCategory(): string {
  const categories = [
    "General",
    "Products",
    "Logistics",
    "Pricing",
    "Quality",
    "Shipping",
    "Specifications",
    "Compliance",
    "Services"
  ];
  
  return categories[Math.floor(Math.random() * categories.length)];
} 