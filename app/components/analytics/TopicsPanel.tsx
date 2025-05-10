'use client';

import { useState, useEffect } from 'react';
import MetricCard from './MetricCard';

interface TopicData {
  topic: string;
  count: number;
  percentage: number;
}

interface TopicsMetrics {
  period: string;
  totalTopics: number;
  totalConversations: number;
  topTopics: TopicData[];
  topicTrends?: Array<{
    date: string;
    topics: Record<string, number>;
  }>;
}

export default function TopicsPanel({ timeRange }: { timeRange: number }) {
  const [data, setData] = useState<TopicsMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        // In a real app, this would be:
        // const res = await fetch(`/api/analytics/top-topics?days=${timeRange}`);
        
        // For the mockup, we'll generate mock data
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Generate topic data
        const mockTopics: TopicData[] = [
          { topic: "Wheat", count: Math.floor(Math.random() * 100) + 50, percentage: 0 },
          { topic: "Logistics", count: Math.floor(Math.random() * 80) + 40, percentage: 0 },
          { topic: "Pricing", count: Math.floor(Math.random() * 60) + 30, percentage: 0 },
          { topic: "Shipping", count: Math.floor(Math.random() * 50) + 25, percentage: 0 },
          { topic: "Quality", count: Math.floor(Math.random() * 40) + 20, percentage: 0 },
          { topic: "Barley", count: Math.floor(Math.random() * 30) + 15, percentage: 0 },
          { topic: "Oilseeds", count: Math.floor(Math.random() * 25) + 10, percentage: 0 },
          { topic: "Certifications", count: Math.floor(Math.random() * 20) + 5, percentage: 0 },
        ];
        
        // Calculate percentages
        const totalCount = mockTopics.reduce((sum, topic) => sum + topic.count, 0);
        mockTopics.forEach(topic => {
          topic.percentage = (topic.count / totalCount) * 100;
        });
        
        // Sort by count
        mockTopics.sort((a, b) => b.count - a.count);
        
        // Generate topic trends over time
        const topicNames = mockTopics.slice(0, 5).map(t => t.topic);
        const mockTrends = Array.from({ length: timeRange }, (_, i) => {
          const date = new Date(Date.now() - (timeRange - i - 1) * 86400000);
          const topics: Record<string, number> = {};
          
          topicNames.forEach(topic => {
            // Create a somewhat realistic trend with some randomness
            const baseValue = mockTopics.find(t => t.topic === topic)?.count || 20;
            const dailyValue = Math.max(1, Math.floor(baseValue / timeRange * (0.7 + Math.random() * 0.6)));
            topics[topic] = dailyValue;
          });
          
          return {
            date: date.toLocaleDateString(),
            topics
          };
        });
        
        // Mock data structure
        const mockData: TopicsMetrics = {
          period: `Last ${timeRange} days`,
          totalTopics: mockTopics.length,
          totalConversations: totalCount,
          topTopics: mockTopics,
          topicTrends: mockTrends
        };
        
        setData(mockData);
      } catch (err) {
        console.error('Error fetching topics data:', err);
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
        <p>Loading topics data...</p>
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
        <p>Error loading topics data: {error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="panel-empty">
        <p>No topics data available for the selected time period.</p>
      </div>
    );
  }

  // Get the top 5 topics for displaying in the trend chart
  const topFiveTopics = data.topTopics.slice(0, 5).map(t => t.topic);
  const colors = ['#1a3b5d', '#4b77b8', '#7ca1db', '#a5c1ea', '#d0e0f7'];

  return (
    <div className="topics-panel">
      <h2>Topic Analysis</h2>
      <p className="time-period">Data from the last {timeRange} days</p>
      
      <div className="topic-metrics">
        <MetricCard 
          title="Total Topics" 
          value={data.totalTopics.toString()}
          icon={
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
          }
        />
        <MetricCard 
          title="Total Conversations" 
          value={data.totalConversations.toString()}
          icon={
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          }
        />
      </div>
      
      <div className="topics-content">
        <div className="topics-list">
          <h3>Top Topics</h3>
          <div className="topic-bars">
            {data.topTopics.map((topic, index) => (
              <div key={index} className="topic-bar-container">
                <div className="topic-info">
                  <div className="topic-name">{topic.topic}</div>
                  <div className="topic-count">{topic.count} mentions</div>
                </div>
                <div className="bar-container">
                  <div 
                    className="bar" 
                    style={{ 
                      width: `${Math.min(100, (topic.count / data.topTopics[0].count) * 100)}%`,
                      backgroundColor: colors[index % colors.length]
                    }}
                  ></div>
                  <span className="bar-value">{topic.percentage.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="topics-trend">
          <h3>Topic Trends Over Time</h3>
          <div className="chart-area">
            <svg width="100%" height="300" viewBox="0 0 600 300">
              {/* X and Y axes */}
              <line x1="50" y1="250" x2="580" y2="250" stroke="#e1e4e8" strokeWidth="1" />
              <line x1="50" y1="250" x2="50" y2="50" stroke="#e1e4e8" strokeWidth="1" />
              
              {/* Grid lines */}
              <line x1="50" y1="200" x2="580" y2="200" stroke="#e1e4e8" strokeWidth="0.5" strokeDasharray="5,5" />
              <line x1="50" y1="150" x2="580" y2="150" stroke="#e1e4e8" strokeWidth="0.5" strokeDasharray="5,5" />
              <line x1="50" y1="100" x2="580" y2="100" stroke="#e1e4e8" strokeWidth="0.5" strokeDasharray="5,5" />
              
              {/* Plot the data */}
              {data.topicTrends && topFiveTopics.map((topicName, topicIndex) => {
                // Calculate the maximum value for scaling
                let maxValue = 0;
                data.topicTrends?.forEach(day => {
                  Object.values(day.topics).forEach(value => {
                    maxValue = Math.max(maxValue, value);
                  });
                });
                
                // Plot points and lines for each topic
                return (
                  <g key={topicIndex}>
                    {data.topicTrends?.map((day, dayIndex, days) => {
                      const xStep = 530 / (days.length - 1);
                      const x = 50 + dayIndex * xStep;
                      const value = day.topics[topicName] || 0;
                      const y = 250 - (value / maxValue) * 200;
                      
                      return (
                        <g key={`${topicName}-${dayIndex}`}>
                          <circle 
                            cx={x} 
                            cy={y} 
                            r="3" 
                            fill={colors[topicIndex % colors.length]} 
                          />
                          
                          {dayIndex < days.length - 1 && (
                            <line 
                              x1={x} 
                              y1={y} 
                              x2={50 + (dayIndex + 1) * xStep} 
                              y2={250 - ((days[dayIndex + 1].topics[topicName] || 0) / maxValue) * 200}
                              stroke={colors[topicIndex % colors.length]} 
                              strokeWidth="2" 
                            />
                          )}
                        </g>
                      );
                    })}
                  </g>
                );
              })}
              
              {/* X-axis labels */}
              {data.topicTrends && data.topicTrends.map((day, index, array) => {
                const xStep = 530 / (array.length - 1);
                const x = 50 + index * xStep;
                
                return index % Math.max(1, Math.floor(array.length / 7)) === 0 ? (
                  <text key={index} x={x} y="270" textAnchor="middle" fontSize="10">{day.date}</text>
                ) : null;
              })}
              
              {/* Legend */}
              <foreignObject x="440" y="10" width="150" height="130">
                <div className="chart-legend">
                  {topFiveTopics.map((topic, i) => (
                    <div key={i} className="legend-item">
                      <span 
                        className="color-box" 
                        style={{ backgroundColor: colors[i % colors.length] }}
                      ></span>
                      <span className="topic-name">{topic}</span>
                    </div>
                  ))}
                </div>
              </foreignObject>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
} 