'use client';

import { useState, useEffect } from 'react';
import MetricCard from './MetricCard';

interface QualityMetrics {
  period: string;
  avgRelevanceScore: number;
  avgResponseQuality: number;
  humanAssistanceRate: number;
  categoryDistribution: Record<string, number>;
  qualityOverTime?: Array<{
    date: string;
    relevanceScore: number;
    responseQuality: number;
  }>;
  topHumanAssistanceQueries?: Array<{
    query: string;
    count: number;
  }>;
}

export default function QualityPanel({ timeRange }: { timeRange: number }) {
  const [data, setData] = useState<QualityMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/analytics/conversation-quality?days=${timeRange}`);
        const result = await res.json();
        if (result.status === 'Success') {
          setData(result.data);
        } else {
          throw new Error(result.message || 'Failed to fetch quality metrics');
        }
      } catch (err) {
        console.error('Error fetching quality data:', err);
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
        <p>Loading quality metrics...</p>
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
        <p>Error loading quality data: {error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="panel-empty">
        <p>No quality metrics available for the selected time period.</p>
      </div>
    );
  }

  return (
    <div className="quality-panel">
      <h2>Conversation Quality</h2>
      <p className="time-period">Data from the last {timeRange} days</p>
      
      <div className="metrics-grid">
        <MetricCard 
          title="Relevance Score" 
          value={`${(data.avgRelevanceScore * 100).toFixed(1)}%`}
          icon={
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          }
        />
        <MetricCard 
          title="Response Quality" 
          value={`${(data.avgResponseQuality * 100).toFixed(1)}%`}
          icon={
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
            </svg>
          }
        />
        <MetricCard 
          title="Human Assistance" 
          value={`${(data.humanAssistanceRate * 100).toFixed(1)}%`}
          icon={
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          }
        />
        <MetricCard 
          title="Categories" 
          value={Object.keys(data.categoryDistribution).length.toString()}
          icon={
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
              <line x1="8" y1="6" x2="21" y2="6"></line>
              <line x1="8" y1="12" x2="21" y2="12"></line>
              <line x1="8" y1="18" x2="21" y2="18"></line>
              <line x1="3" y1="6" x2="3.01" y2="6"></line>
              <line x1="3" y1="12" x2="3.01" y2="12"></line>
              <line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
          }
        />
      </div>
      
      <div className="charts-container">
        <div className="chart-box quality-chart">
          <h3>Quality Metrics Over Time</h3>
          <div className="chart-area">
            <svg width="100%" height="250" viewBox="0 0 600 250">
              {/* X and Y axes */}
              <line x1="50" y1="220" x2="580" y2="220" stroke="#e1e4e8" strokeWidth="1" />
              <line x1="50" y1="220" x2="50" y2="30" stroke="#e1e4e8" strokeWidth="1" />
              
              {/* Y-axis labels */}
              <text x="45" y="220" textAnchor="end" fontSize="12">0%</text>
              <text x="45" y="170" textAnchor="end" fontSize="12">25%</text>
              <text x="45" y="120" textAnchor="end" fontSize="12">50%</text>
              <text x="45" y="70" textAnchor="end" fontSize="12">75%</text>
              <text x="45" y="30" textAnchor="end" fontSize="12">100%</text>
              
              {/* Grid lines */}
              <line x1="50" y1="170" x2="580" y2="170" stroke="#e1e4e8" strokeWidth="0.5" strokeDasharray="5,5" />
              <line x1="50" y1="120" x2="580" y2="120" stroke="#e1e4e8" strokeWidth="0.5" strokeDasharray="5,5" />
              <line x1="50" y1="70" x2="580" y2="70" stroke="#e1e4e8" strokeWidth="0.5" strokeDasharray="5,5" />
              
              {/* Plot the data */}
              {data.qualityOverTime && data.qualityOverTime.length > 0 && data.qualityOverTime.map((point, index, array) => {
                // Ensure we don't divide by zero
                const xStep = array.length > 1 ? 530 / (array.length - 1) : 530;
                const x = 50 + index * xStep;
                
                // Calculate Y positions (inverted, since SVG y=0 is at the top)
                const relevanceY = 220 - (point.relevanceScore * 190);
                const qualityY = 220 - (point.responseQuality * 190);
                
                return (
                  <g key={index}>
                    {/* Plot points */}
                    <circle cx={x.toFixed(2)} cy={relevanceY.toFixed(2)} r="4" fill="#4b77b8" />
                    <circle cx={x.toFixed(2)} cy={qualityY.toFixed(2)} r="4" fill="#1a3b5d" />
                    
                    {/* Connect lines */}
                    {index < array.length - 1 && (
                      <>
                        <line 
                          x1={x.toFixed(2)} 
                          y1={relevanceY.toFixed(2)} 
                          x2={(50 + (index + 1) * xStep).toFixed(2)} 
                          y2={(220 - (array[index + 1].relevanceScore * 190)).toFixed(2)}
                          stroke="#4b77b8" 
                          strokeWidth="2" 
                        />
                        <line 
                          x1={x.toFixed(2)} 
                          y1={qualityY.toFixed(2)} 
                          x2={(50 + (index + 1) * xStep).toFixed(2)} 
                          y2={(220 - (array[index + 1].responseQuality * 190)).toFixed(2)}
                          stroke="#1a3b5d" 
                          strokeWidth="2" 
                        />
                      </>
                    )}
                    
                    {/* X-axis labels (show every few days to avoid crowding) */}
                    {index % Math.max(1, Math.floor(array.length / 7)) === 0 && (
                      <text x={x.toFixed(2)} y="235" textAnchor="middle" fontSize="10">{point.date}</text>
                    )}
                  </g>
                );
              })}
              
              {/* Empty state if no data */}
              {(!data.qualityOverTime || data.qualityOverTime.length === 0) && (
                <text x="300" y="125" textAnchor="middle" fill="#718096">No quality data available</text>
              )}
              
              {/* Legend */}
              <circle cx="480" cy="25" r="4" fill="#1a3b5d" />
              <text x="490" y="28" fontSize="12">Response Quality</text>
              <circle cx="480" cy="45" r="4" fill="#4b77b8" />
              <text x="490" y="48" fontSize="12">Relevance Score</text>
            </svg>
          </div>
        </div>
        
        <div className="chart-box top-queries">
          <h3>Top Queries Requiring Human Assistance</h3>
          <div className="queries-list">
            {data.topHumanAssistanceQueries && data.topHumanAssistanceQueries.length > 0 ? (
              data.topHumanAssistanceQueries.map((item, index) => {
                // Calculate max count safely
                const maxCount = Math.max(...data.topHumanAssistanceQueries!.map(q => q.count || 0)) || 1;
                const percentage = (item.count / maxCount) * 100;
                
                return (
                  <div key={index} className="query-item">
                    <div className="query-text">&ldquo;{item.query}&rdquo;</div>
                    <div className="query-count">{item.count} occurrences</div>
                    <div className="query-bar-container">
                      <div 
                        className="query-bar" 
                        style={{ 
                          width: `${Math.min(100, percentage)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-data">No queries requiring human assistance found</div>
            )}
          </div>
        </div>
      </div>
      
      <div className="category-distribution">
        <h3>Category Distribution</h3>
        <div className="bar-chart">
          {Object.entries(data.categoryDistribution).length > 0 ? (
            Object.entries(data.categoryDistribution).map(([category, count], index) => {
              // Calculate total safely
              const totalCount = Object.values(data.categoryDistribution).reduce((a, b) => a + b, 0) || 1;
              const percentage = (count / totalCount) * 100;
              const colors = ['#1a3b5d', '#4b77b8', '#7ca1db', '#a5c1ea', '#d0e0f7'];
              
              return (
                <div key={index} className="category-bar-container">
                  <div className="category-label">{category}</div>
                  <div className="bar-container">
                    <div 
                      className="bar" 
                      style={{ 
                        width: `${percentage.toFixed(1)}%`,
                        backgroundColor: colors[index % colors.length] 
                      }}
                    ></div>
                    <span className="bar-value">{percentage.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-data">No category data available</div>
          )}
        </div>
      </div>
    </div>
  );
} 