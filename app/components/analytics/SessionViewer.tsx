'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  timestamp: string;
  question: string;
  answer: string;
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
  totalResponseTimeMs: number;
  conversationFlow: Message[];
  hasHumanAssistance: boolean;
  userInfo?: {
    fullname?: string;
    email?: string;
    phone?: string | null;
  };
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
        const res = await fetch(`/api/analytics/session/${sessionId}`);
        const result = await res.json();
        if (result.status === 'Success') {
          setSessionData(result.data);
        } else {
          throw new Error(result.message || 'Failed to fetch session data');
        }
      } catch (err) {
        console.error('Failed to fetch session data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }
    fetchSessionData();
  }, [sessionId]);

  const exportConversation = () => {
    if (!sessionData) return;
    
    // Format the conversation for export
    let exportText = `# Conversation Export - Session ${sessionData.sessionId}\n\n`;
    exportText += `Date: ${new Date(sessionData.firstInteraction).toLocaleDateString()}\n`;
    if (sessionData.userInfo?.fullname) {
      exportText += `User: ${sessionData.userInfo.fullname}\n`;
    }
    if (sessionData.userInfo?.email) {
      exportText += `Email: ${sessionData.userInfo.email}\n`;
    }
    if (sessionData.userInfo?.phone) {
      exportText += `Phone: ${sessionData.userInfo.phone}\n`;
    }
    exportText += `Duration: ${formatDuration(sessionData.sessionDurationMs)}\n\n`;
    
    // Add each message
    sessionData.conversationFlow.forEach((message, index) => {
      exportText += `## Message ${index + 1} - ${new Date(message.timestamp).toLocaleString()}\n\n`;
      exportText += `### User\n${message.question}\n\n`;
      exportText += `### Assistant\n${message.answer}\n\n`;
      
      if (message.category || message.relevanceScore !== undefined || message.responseTimeMs) {
        exportText += "### Metadata\n";
        if (message.category) exportText += `- Category: ${message.category}\n`;
        if (message.relevanceScore !== undefined) exportText += `- Relevance Score: ${(message.relevanceScore * 100).toFixed(1)}%\n`;
        if (message.responseTimeMs) exportText += `- Response Time: ${message.responseTimeMs}ms\n`;
        exportText += "\n";
      }
    });
    
    // Create blob and download
    const blob = new Blob([exportText], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${sessionId.substring(0, 8)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
        <div className="session-id-header">
          <h2>Session:</h2> 
          <div className="copyable-session-id">
            <span className="full-id">{sessionId}</span>
            <button 
              className="copy-session-id"
              onClick={() => {
                navigator.clipboard.writeText(sessionId);
                const tooltip = document.querySelector('.session-copied-tooltip');
                if (tooltip) {
                  tooltip.classList.add('show');
                  setTimeout(() => tooltip.classList.remove('show'), 1500);
                }
              }}
              title="Copy Session ID"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              <span className="session-copied-tooltip">Copied!</span>
            </button>
          </div>
        </div>
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
            <span className="label">Interactions:</span>
            <span className="value">{sessionData.interactionCount}</span>
          </div>
          <div className="meta-item">
            <span className="label">Avg Response:</span>
            <span className="value">{Math.round(sessionData.avgResponseTimeMs)}ms</span>
          </div>
          {sessionData.userInfo && (
            <>
              {sessionData.userInfo.fullname && (
                <div className="meta-item">
                  <span className="label">Name:</span>
                  <span className="value">{sessionData.userInfo.fullname}</span>
                </div>
              )}
              {sessionData.userInfo.email && (
                <div className="meta-item">
                  <span className="label">Email:</span>
                  <span className="value">{sessionData.userInfo.email}</span>
                </div>
              )}
              {sessionData.userInfo.phone && (
                <div className="meta-item">
                  <span className="label">Phone:</span>
                  <span className="value">{sessionData.userInfo.phone}</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      <div className="conversation-timeline">
        {sessionData.conversationFlow.map((message, index) => (
          <div key={index} className="message-group">
            {/* User message */}
            <div className="chat-message human">
              <div className="message-header">
                <div className="message-role">
                  {sessionData.userInfo?.fullname || "User"}
                </div>
                <div className="message-time">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
              <div className="message-content">{message.question}</div>
            </div>

            {/* Assistant message */}
            <div className="chat-message assistant">
              <div className="message-header">
                <div className="message-role">Assistant</div>
                <div className="message-time">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
              <div className="message-content markdown-content">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Style headings
                    h3: ({...props}) => <h3 className="markdown-h3" {...props} />,
                    // Style lists properly
                    ul: ({...props}) => <ul className="markdown-ul" {...props} />,
                    ol: ({...props}) => <ol className="markdown-ol" {...props} />,
                    // Style list items
                    li: ({...props}) => <li className="markdown-li" {...props} />,
                    // Style paragraphs
                    p: ({...props}) => <p className="markdown-p" {...props} />,
                    // Style bold text
                    strong: ({...props}) => <strong className="markdown-strong" {...props} />,
                    // Ensure all links open in a new tab
                    a: ({href, children, ...props}) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="markdown-link" {...props}>
                        {children}
                      </a>
                    ),
                  }}
                >
                  {message.answer}
                </ReactMarkdown>
              </div>
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
            </div>
          </div>
        ))}
      </div>
      
      <div className="export-container">
        <button className="export-button" onClick={exportConversation}>
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