'use client';

import { useState, useEffect } from 'react';
import MetricCard from './MetricCard';

interface WindowSizeData {
  size: string;
  avgRelevanceScore: number;
  interactionsAnalyzed: number;
}

interface ConversationWindowsSuccessData {
  period: string;
  sessionsAnalyzed: number;
  windowSizeEffectiveness: {
    smallWindow: WindowSizeData;
    mediumWindow: WindowSizeData;
    largeWindow: WindowSizeData;
  };
  recommendedWindowSize: string;
}

interface ConversationWindowsInsufficientData {
  period: string;
  sessionsAnalyzed: number;
  message: string;
}

type ConversationWindowsData = ConversationWindowsSuccessData | ConversationWindowsInsufficientData;

// Type guard to check if we have sufficient data for analysis
function hasWindowAnalysisData(data: ConversationWindowsData): data is ConversationWindowsSuccessData {
  return 'windowSizeEffectiveness' in data && 'recommendedWindowSize' in data;
}

export default function ConversationWindowsPanel({ timeRange }: { timeRange: number }) {
  const [data, setData] = useState<ConversationWindowsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/analytics/conversation-windows?days=${timeRange}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch conversation windows data: ${res.status}`);
        }
        const result = await res.json();
        if (result.status === 'Success') {
          setData(result.data);
        } else {
          throw new Error(result.message || 'Failed to fetch conversation windows data');
        }
      } catch (err) {
        console.error('Error fetching conversation windows data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [timeRange]);

  if (isLoading) {
    return (
      <div className="panel-loading">
        <div className="loading-spinner"></div>
        <p>Loading conversation windows data...</p>
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
        <p>Error loading conversation windows data: {error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="panel-empty">
        <p>No conversation windows data available for the selected time period.</p>
      </div>
    );
  }

  // Handle insufficient data case
  if (!hasWindowAnalysisData(data)) {
    return (
      <div className="conversation-windows-panel">
        <h2>Conversation Windows Analysis</h2>
        <p className="time-period">{data.period}</p>
        
        <div className="metrics-grid">
          <MetricCard 
            title="Sessions Analyzed" 
            value={data.sessionsAnalyzed.toString()}
            icon={
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
              </svg>
            }
          />
        </div>
        
        <div className="window-insights">
          <div className="insights-container">
            <div className="insight-card">
              <h4>Insufficient Data</h4>
              <p>{data.message || "Not enough conversation data for window size analysis."}</p>
              <p>Try analyzing a longer time period or wait until more conversations have been recorded.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="conversation-windows-panel">
      <h2>Conversation Windows Analysis</h2>
      <p className="time-period">{data.period}</p>
      
      <div className="metrics-grid">
        <MetricCard 
          title="Sessions Analyzed" 
          value={data.sessionsAnalyzed.toString()}
          icon={
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
          }
        />
        <MetricCard 
          title="Recommended Window" 
          value={data.recommendedWindowSize}
          icon={
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          }
        />
      </div>
      
      <div className="window-effectiveness-chart">
        <h3>Window Size Effectiveness</h3>
        <div className="chart-container">
          <div className="bar-chart">
            {Object.entries(data.windowSizeEffectiveness).map(([key, windowData]) => {
              const friendlyNames = {
                smallWindow: 'Small Window',
                mediumWindow: 'Medium Window',
                largeWindow: 'Large Window'
              };
              const name = friendlyNames[key as keyof typeof friendlyNames];
              const percentage = windowData.avgRelevanceScore * 100;
              
              return (
                <div className="bar-group" key={key}>
                  <div className="bar-label">
                    <span className="window-name">{name}</span>
                    <span className="window-size">({windowData.size})</span>
                  </div>
                  <div className="bar-container">
                    <div 
                      className="bar" 
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: 
                          key === 'smallWindow' ? '#7cb5ec' : 
                          key === 'mediumWindow' ? '#434348' : '#90ed7d'
                      }}
                    ></div>
                    <span className="bar-value">{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="interactions-analyzed">
                    Based on {windowData.interactionsAnalyzed} interactions
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="window-insights">
        <h3>Insights</h3>
        <div className="insights-container">
          <div className="insight-card">
            <h4>Optimal Window Size</h4>
            <p>
              Based on the data analysis, the recommended conversation context window size is {data.recommendedWindowSize}.
            </p>
          </div>
          <div className="insight-card">
            <h4>Performance Comparison</h4>
            <p>
              {(() => {
                const windows = data.windowSizeEffectiveness;
                const bestWindow = Object.entries(windows).reduce((best, [key, value]) => {
                  return value.avgRelevanceScore > best.score ? 
                    { name: key, score: value.avgRelevanceScore } : best;
                }, { name: '', score: 0 });
                
                const friendlyNames = {
                  smallWindow: 'Small windows (1-3 messages)',
                  mediumWindow: 'Medium windows (4-7 messages)',
                  largeWindow: 'Large windows (8+ messages)'
                };
                
                return `${friendlyNames[bestWindow.name as keyof typeof friendlyNames]} perform best with a relevance score of ${(bestWindow.score * 100).toFixed(1)}%.`;
              })()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 