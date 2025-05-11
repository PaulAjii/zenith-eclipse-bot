'use client';

import React, { useState, useEffect } from 'react';
import MetricCard from './MetricCard';

type OverviewData = {
  period: string;
  totalInteractions: number;
  totalConversations: number;
  avgResponseTimeMs: number;
  humanAssistancePercentage: number;
  categoryCounts: Record<string, number>;
  dailyInteractions?: Array<{ date: string; count: number }>;
};

export default function OverviewPanel({ timeRange }: { timeRange: number }) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/analytics/summary?days=${timeRange}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }
        const result = await res.json();
        if (result.status === 'Success') {
          setData(result.data);
        } else {
          throw new Error(result.message || 'Failed to fetch analytics data');
        }
      } catch (err) {
        console.error('Error fetching overview data:', err);
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
        <p>Loading overview data...</p>
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
        <p>Error loading data: {error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="panel-empty">
        <p>No analytics data available for the selected time period.</p>
      </div>
    );
  }

  // Mock data for chart rendering if not provided by the API
  const chartData = data.dailyInteractions || 
    Array.from({ length: timeRange }, (_, i) => ({
      date: new Date(Date.now() - (timeRange - i - 1) * 86400000).toLocaleDateString(),
      count: Math.floor(Math.random() * 100)
    }));

  // Calculate category percentages for the pie chart
  const totalCategories = Object.values(data.categoryCounts).reduce((a, b) => a + b, 0);
  const categoryPercentages = Object.entries(data.categoryCounts).map(([name, count]) => ({
    name,
    value: totalCategories > 0 ? Math.round((count / totalCategories) * 100) : 0
  }));

  return (
    <div className="overview-panel">
      <h2>Dashboard Overview</h2>
      <p className="time-period">Data from the last {timeRange} days</p>
      
      <div className="metrics-grid">
        <MetricCard 
          title="Total Interactions" 
          value={data.totalInteractions.toString()}
          icon={
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          }
        />
        <MetricCard 
          title="Total Conversations" 
          value={data.totalConversations.toString()}
          icon={
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M17 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2v4l-4-4H9a2 2 0 0 1-2-2v-1"></path>
              <path d="M7 18H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1"></path>
            </svg>
          }
        />
        <MetricCard 
          title="Avg Response Time" 
          value={`${Math.round(data.avgResponseTimeMs)}ms`}
          icon={
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          }
        />
        <MetricCard 
          title="Human Assistance" 
          value={`${data.humanAssistancePercentage.toFixed(1)}%`}
          icon={
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          }
        />
      </div>
      
      <div className="charts-container">
        <div className="chart-box">
          <h3>Conversation Volume</h3>
          <div className="chart-area">
            <svg width="100%" height="200" viewBox="0 0 600 200">
              {chartData.length > 0 && chartData.map((dataPoint, index, array) => {
                // Ensure array length > 1 to avoid division by zero
                const xStep = array.length > 1 ? 570 / (array.length - 1) : 570;
                const x = 15 + index * xStep;
                
                // Find max count safely, defaulting to 1 if no valid counts
                const counts = array.map(d => d.count).filter(count => typeof count === 'number' && !isNaN(count));
                const maxCount = counts.length > 0 ? Math.max(...counts) : 1;
                
                // Default y to bottom if count is invalid
                const y = typeof dataPoint.count === 'number' && !isNaN(dataPoint.count) && maxCount > 0
                  ? 180 - (dataPoint.count / maxCount) * 150
                  : 180;
                
                // Only use next point if it exists
                const nextIndex = index + 1;
                const hasNextPoint = nextIndex < array.length;
                
                // Calculate next point's position safely
                const nextY = hasNextPoint && typeof array[nextIndex].count === 'number' && !isNaN(array[nextIndex].count) && maxCount > 0
                  ? 180 - (array[nextIndex].count / maxCount) * 150
                  : 180;
                
                const nextX = hasNextPoint ? 15 + nextIndex * xStep : x;
                
                return (
                  <g key={index}>
                    <circle cx={x} cy={y} r="4" fill="#1a3b5d" />
                    {hasNextPoint && (
                      <line 
                        x1={x} 
                        y1={y} 
                        x2={nextX} 
                        y2={nextY}
                        stroke="#1a3b5d" 
                        strokeWidth="2" 
                      />
                    )}
                    {index % Math.max(1, Math.floor(array.length / 7)) === 0 && (
                      <text x={x.toString()} y="195" textAnchor="middle" fontSize="10">{dataPoint.date}</text>
                    )}
                  </g>
                );
              })}
              <line x1="15" y1="180" x2="585" y2="180" stroke="#e1e4e8" strokeWidth="1" />
              {chartData.length === 0 && (
                <text x="300" y="100" textAnchor="middle" fill="#718096">No data available</text>
              )}
            </svg>
          </div>
        </div>
        
        <div className="chart-box">
          <h3>Category Distribution</h3>
          <div className="chart-area">
            <svg width="100%" height="200" viewBox="0 0 300 200">
              {categoryPercentages.length > 0 ? (
                <>
                  <circle cx="100" cy="100" r="80" fill="#e1e4e8" />
                  {categoryPercentages.reduce((acc, curr, i) => {
                    const colors = ['#1a3b5d', '#4b77b8', '#7ca1db', '#a5c1ea', '#d0e0f7'];
                    const startAngle = acc.prevAngle;
                    const angle = (curr.value / 100) * Math.PI * 2;
                    const endAngle = startAngle + angle;
                    
                    // Safely calculate coordinates
                    const x1 = 100 + 80 * Math.cos(startAngle);
                    const y1 = 100 + 80 * Math.sin(startAngle);
                    const x2 = 100 + 80 * Math.cos(endAngle);
                    const y2 = 100 + 80 * Math.sin(endAngle);
                    
                    // For label positioning
                    const labelAngle = startAngle + angle / 2;
                    const labelX = 100 + 100 * Math.cos(labelAngle);
                    const labelY = 100 + 100 * Math.sin(labelAngle);
                    
                    const largeArcFlag = angle > Math.PI ? 1 : 0;
                    
                    return {
                      prevAngle: endAngle,
                      elements: [
                        ...acc.elements,
                        <path
                          key={i}
                          d={`M 100 100 L ${x1.toFixed(2)} ${y1.toFixed(2)} A 80 80 0 ${largeArcFlag} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`}
                          fill={colors[i % colors.length]}
                        />,
                        <text
                          key={`label-${i}`}
                          x={labelX.toFixed(2)}
                          y={labelY.toFixed(2)}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#fff"
                          style={{ pointerEvents: 'none' }}
                        >
                          {curr.value > 5 ? `${curr.value}%` : ''}
                        </text>
                      ]
                    };
                  }, { prevAngle: -Math.PI / 2, elements: [] as React.ReactElement[] }).elements}
                  
                  <foreignObject x="200" y="20" width="100" height="180">
                    <div className="pie-legend">
                      {categoryPercentages.map((category, i) => {
                        const colors = ['#1a3b5d', '#4b77b8', '#7ca1db', '#a5c1ea', '#d0e0f7'];
                        return (
                          <div key={i} className="legend-item">
                            <span className="color-box" style={{ backgroundColor: colors[i % colors.length] }}></span>
                            <span className="label">{category.name}: {category.value}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </foreignObject>
                </>
              ) : (
                <text x="150" y="100" textAnchor="middle">No category data available</text>
              )}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
} 