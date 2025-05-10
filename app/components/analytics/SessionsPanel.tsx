'use client';

import { useState, useEffect } from 'react';
import SessionViewer from './SessionViewer';

interface Session {
  sessionId: string;
  interactionCount: number;
  firstInteraction: string;
  lastInteraction: string;
  sessionDurationMs: number;
  avgResponseTimeMs: number;
}

export default function SessionsPanel({ timeRange }: { timeRange: number }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<keyof Session>('lastInteraction');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Mock data - in a real app, this would fetch from an API endpoint
  useEffect(() => {
    async function fetchSessions() {
      setIsLoading(true);
      setError(null);
      
      // In a real app, this would be:
      // const res = await fetch(`/api/analytics/sessions?days=${timeRange}`);
      
      // For the mockup we'll generate random data
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const mockSessions: Session[] = Array.from({ length: 25 }, (_, i) => {
          const lastInteraction = new Date(Date.now() - Math.random() * timeRange * 86400000);
          const sessionDuration = Math.floor(Math.random() * 1800000); // 0-30 minutes
          const firstInteraction = new Date(lastInteraction.getTime() - sessionDuration);
          const interactionCount = Math.floor(Math.random() * 20) + 1;
          
          return {
            sessionId: `session-${Date.now()}-${i}`,
            interactionCount,
            firstInteraction: firstInteraction.toISOString(),
            lastInteraction: lastInteraction.toISOString(),
            sessionDurationMs: sessionDuration,
            avgResponseTimeMs: Math.floor(Math.random() * 3000) + 500,
          };
        });
        
        setSessions(mockSessions);
      } catch (err) {
        console.error("Error fetching sessions:", err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchSessions();
  }, [timeRange]);

  const handleSort = (column: keyof Session) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
  };

  const filteredSessions = sessions.filter(session => {
    if (!searchQuery) return true;
    return session.sessionId.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const sortedSessions = [...filteredSessions].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDir === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDir === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    
    return 0;
  });

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

  return (
    <div className="sessions-panel">
      {selectedSession ? (
        <div className="session-detail-view">
          <button 
            className="back-to-sessions" 
            onClick={() => setSelectedSession(null)}
          >
            ← Back to Sessions
          </button>
          <SessionViewer sessionId={selectedSession} />
        </div>
      ) : (
        <>
          <div className="panel-header">
            <h2>Chat Sessions</h2>
            <p className="time-period">Data from the last {timeRange} days</p>
            
            <div className="sessions-controls">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search sessions..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="session-search"
                />
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" className="search-icon">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="sessions-table-container">
            <table className="sessions-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('sessionId')}>
                    Session ID
                    {sortBy === 'sessionId' && (
                      <span className="sort-indicator">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </th>
                  <th onClick={() => handleSort('interactionCount')}>
                    Messages
                    {sortBy === 'interactionCount' && (
                      <span className="sort-indicator">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </th>
                  <th onClick={() => handleSort('lastInteraction')}>
                    Last Activity
                    {sortBy === 'lastInteraction' && (
                      <span className="sort-indicator">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </th>
                  <th onClick={() => handleSort('sessionDurationMs')}>
                    Duration
                    {sortBy === 'sessionDurationMs' && (
                      <span className="sort-indicator">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </th>
                  <th onClick={() => handleSort('avgResponseTimeMs')}>
                    Avg Response
                    {sortBy === 'avgResponseTimeMs' && (
                      <span className="sort-indicator">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedSessions.length > 0 ? (
                  sortedSessions.map(session => (
                    <tr key={session.sessionId}>
                      <td>{session.sessionId.substring(0, 12)}...</td>
                      <td>{session.interactionCount}</td>
                      <td>{new Date(session.lastInteraction).toLocaleString()}</td>
                      <td>{formatDuration(session.sessionDurationMs)}</td>
                      <td>{session.avgResponseTimeMs}ms</td>
                      <td>
                        <button 
                          className="view-session-btn"
                          onClick={() => setSelectedSession(session.sessionId)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="no-data">
                      {searchQuery ? 'No sessions match your search' : 'No sessions found for this time period'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="sessions-summary">
            <p>
              <strong>{sortedSessions.length}</strong> sessions shown
              {searchQuery && ` (filtered from ${sessions.length})`}
            </p>
          </div>
        </>
      )}
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