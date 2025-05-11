'use client';

import { useState, useEffect } from 'react';

interface VoiceInteraction {
  sessionId: string;
  userInfo: {
    fullname: string;
    email: string;
    phone: string | null;
  };
  prompt: string;
  response: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export default function VoiceAnalyticsPanel({ timeRange }: { timeRange: number }) {
  const [voiceData, setVoiceData] = useState<VoiceInteraction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInteraction, setSelectedInteraction] = useState<VoiceInteraction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<keyof VoiceInteraction>('timestamp');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    async function fetchVoiceAnalytics() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/voice-analytics`);
        const result = await res.json();
        if (result.status === 'Success') {
          // Filter by timeRange if needed
          const now = new Date();
          const earliestDate = new Date(now.setDate(now.getDate() - timeRange));
          
          const filteredData = result.data.filter((interaction: VoiceInteraction) => {
            const interactionDate = new Date(interaction.timestamp);
            return interactionDate >= earliestDate;
          });
          
          setVoiceData(filteredData);
        } else {
          throw new Error(result.message || 'Failed to fetch voice analytics data');
        }
      } catch (err) {
        console.error("Error fetching voice analytics:", err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }
    fetchVoiceAnalytics();
  }, [timeRange]);

  const handleSort = (column: keyof VoiceInteraction) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('desc');
    }
  };

  const filteredInteractions = voiceData.filter(interaction => {
    if (!searchQuery) return true;
    
    const fullnameMatch = interaction.userInfo?.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    const promptMatch = interaction.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    const sessionMatch = interaction.sessionId.toLowerCase().includes(searchQuery.toLowerCase());
    
    return fullnameMatch || promptMatch || sessionMatch;
  });

  const sortedInteractions = [...filteredInteractions].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (sortBy === 'timestamp') {
      return sortDir === 'asc' 
        ? new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
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
        <p>Loading voice analytics data...</p>
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
        <p>Error loading voice analytics data: {error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (voiceData.length === 0) {
    return (
      <div className="voice-analytics-panel">
        <div className="panel-header">
          <h2>Voice Analytics</h2>
          <p className="time-period">Data from the last {timeRange} days</p>
        </div>
        <div className="panel-empty">
          <p>No voice interaction data available for this time period.</p>
          <p className="empty-suggestion">Voice interactions will appear here once users start using the voice features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="voice-analytics-panel">
      <div className="panel-header">
        <h2>Voice Analytics</h2>
        <p className="time-period">Data from the last {timeRange} days</p>
        
        <div className="sessions-controls">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search voice interactions..."
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
      
      {selectedInteraction ? (
        <div className="voice-interaction-detail">
          <button 
            className="back-to-list" 
            onClick={() => setSelectedInteraction(null)}
          >
            ← Back to List
          </button>
          
          <div className="interaction-detail-card">
            <div className="interaction-header">
              <h3>Voice Interaction Details</h3>
              <div className="interaction-timestamp">
                {new Date(selectedInteraction.timestamp).toLocaleString()}
              </div>
            </div>
            
            <div className="user-details">
              <div className="detail-group">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{selectedInteraction.userInfo?.fullname || 'Anonymous'}</span>
              </div>
              {selectedInteraction.userInfo?.email && (
                <div className="detail-group">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{selectedInteraction.userInfo.email}</span>
                </div>
              )}
              {selectedInteraction.userInfo?.phone && (
                <div className="detail-group">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{selectedInteraction.userInfo.phone}</span>
                </div>
              )}
              <div className="detail-group">
                <span className="detail-label">Session ID:</span>
                <span className="detail-value">{selectedInteraction.sessionId}</span>
              </div>
            </div>
            
            <div className="interaction-content">
              <div className="prompt-container">
                <h4>User&apos;s Spoken Prompt</h4>
                <div className="prompt-text">{selectedInteraction.prompt}</div>
              </div>
              
              <div className="response-container">
                <h4>Bot&apos;s Spoken Response</h4>
                <div className="response-text">{selectedInteraction.response}</div>
              </div>
            </div>
            
            {selectedInteraction.metadata && Object.keys(selectedInteraction.metadata).length > 0 && (
              <div className="metadata-container">
                <h4>Additional Metadata</h4>
                <pre className="metadata-json">
                  {JSON.stringify(selectedInteraction.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="voice-stats-summary">
            <div className="stat-card">
              <div className="stat-title">Total Voice Interactions</div>
              <div className="stat-value">{voiceData.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Unique Users</div>
              <div className="stat-value">
                {new Set(voiceData.map(item => 
                  item.userInfo?.email || item.sessionId
                )).size}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Avg Prompt Length</div>
              <div className="stat-value">
                {Math.round(voiceData.reduce((sum, item) => 
                  sum + item.prompt.split(' ').length, 0) / voiceData.length)} words
              </div>
            </div>
          </div>
          
          <div className="voice-table-container">
            <table className="voice-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort('timestamp')}>
                    Time
                    {sortBy === 'timestamp' && (
                      <span className="sort-indicator">{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </th>
                  <th>User</th>
                  <th>Prompt Preview</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedInteractions.length > 0 ? (
                  sortedInteractions.map((interaction, index) => (
                    <tr key={index}>
                      <td>{new Date(interaction.timestamp).toLocaleString()}</td>
                      <td>{interaction.userInfo?.fullname || 'Anonymous'}</td>
                      <td>
                        {interaction.prompt.length > 60 
                          ? `${interaction.prompt.substring(0, 60)}...` 
                          : interaction.prompt}
                      </td>
                      <td>
                        <button 
                          className="view-interaction-btn"
                          onClick={() => setSelectedInteraction(interaction)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="no-data">
                      {searchQuery ? 'No interactions match your search' : 'No voice interactions found for this time period'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="sessions-summary">
            <p>
              <strong>{sortedInteractions.length}</strong> voice interactions shown
              {searchQuery && ` (filtered from ${voiceData.length})`}
            </p>
          </div>
        </>
      )}
    </div>
  );
} 