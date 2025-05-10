'use client';

import { useState, useEffect } from 'react';
import MetricCard from './MetricCard';

interface RetentionData {
  period: string;
  totalUsers: number;
  newUsers: number;
  returningUsers: number;
  returnRate: number;
  avgSessionsPerUser: number;
  retentionByDay?: Array<{
    day: number;
    retention: number;
  }>;
  cohortRetention?: Array<{
    cohort: string;
    retention: number[];
  }>;
}

export default function RetentionPanel({ timeRange }: { timeRange: number }) {
  const [data, setData] = useState<RetentionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        // In a real app, this would be:
        // const res = await fetch(`/api/analytics/user-retention?days=${timeRange}`);
        
        // For the mockup, we'll generate mock data
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Generate retention data for first 7 days
        const retentionByDay = Array.from({ length: 7 }, (_, i) => ({
          day: i + 1,
          retention: Math.round((100 - (i * (13 + Math.random() * 10))) * 10) / 10
        }));
        
        // Generate cohort retention data
        const cohorts = Array.from({ length: 4 }, (_, i) => {
          const startDate = new Date(Date.now() - (i * 7 + 7) * 86400000);
          const cohortName = `${startDate.getMonth() + 1}/${startDate.getDate()}`;
          
          // Generate retention percentages with realistic dropoff
          const retention = Array.from({ length: 7 }, (_, day) => {
            const base = 100 - (day * (12 + Math.random() * 8));
            return Math.max(0, Math.round(base * 10) / 10);
          });
          
          return {
            cohort: cohortName,
            retention
          };
        });
        
        // Mock data
        const mockData: RetentionData = {
          period: `Last ${timeRange} days`,
          totalUsers: Math.floor(Math.random() * 500) + 300,
          newUsers: Math.floor(Math.random() * 200) + 100,
          returningUsers: Math.floor(Math.random() * 300) + 100,
          returnRate: Math.random() * 40 + 30,
          avgSessionsPerUser: Math.random() * 2 + 1.5,
          retentionByDay,
          cohortRetention: cohorts
        };
        
        setData(mockData);
      } catch (err) {
        console.error('Error fetching retention data:', err);
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
        <p>Loading retention data...</p>
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
        <p>Error loading retention data: {error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="panel-empty">
        <p>No retention data available for the selected time period.</p>
      </div>
    );
  }

  return (
    <div className="retention-panel">
      <h2>User Retention</h2>
      <p className="time-period">Data from the last {timeRange} days</p>
      
      <div className="metrics-grid">
        <MetricCard 
          title="Total Users" 
          value={data.totalUsers.toString()}
          icon={
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          }
        />
        <MetricCard 
          title="New Users" 
          value={data.newUsers.toString()}
          icon={
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
          }
        />
        <MetricCard 
          title="Return Rate" 
          value={`${data.returnRate.toFixed(1)}%`}
          icon={
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
              <polyline points="17 1 21 5 17 9"></polyline>
              <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
              <polyline points="7 23 3 19 7 15"></polyline>
              <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
            </svg>
          }
        />
        <MetricCard 
          title="Sessions/User" 
          value={data.avgSessionsPerUser.toFixed(1)}
          icon={
            <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          }
        />
      </div>
      
      <div className="charts-container">
        <div className="chart-box retention-curve">
          <h3>Retention Curve (First 7 Days)</h3>
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
              {data.retentionByDay && data.retentionByDay.map((point, index, array) => {
                const xStep = 530 / (array.length - 1);
                const x = 50 + index * xStep;
                
                // Calculate Y position (inverted, since SVG y=0 is at top)
                const y = 220 - (point.retention / 100) * 190;
                
                return (
                  <g key={index}>
                    {/* Plot point */}
                    <circle cx={x} cy={y} r="5" fill="#1a3b5d" />
                    
                    {/* Connect lines */}
                    {index < array.length - 1 && (
                      <line 
                        x1={x} 
                        y1={y} 
                        x2={50 + (index + 1) * xStep} 
                        y2={220 - (array[index + 1].retention / 100) * 190}
                        stroke="#1a3b5d" 
                        strokeWidth="2" 
                      />
                    )}
                    
                    {/* X-axis labels */}
                    <text x={x} y="235" textAnchor="middle" fontSize="10">Day {point.day}</text>
                    
                    {/* Data labels */}
                    <text x={x} y={y - 10} textAnchor="middle" fontSize="10" fontWeight="bold">
                      {point.retention}%
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
        
        <div className="chart-box cohort-table">
          <h3>Cohort Retention Analysis</h3>
          <div className="cohort-table-container">
            <table className="cohort-retention-table">
              <thead>
                <tr>
                  <th>Cohort</th>
                  {Array.from({ length: 7 }, (_, i) => (
                    <th key={i}>Day {i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.cohortRetention && data.cohortRetention.map((cohort, index) => (
                  <tr key={index}>
                    <td className="cohort-name">{cohort.cohort}</td>
                    {cohort.retention.map((value, day) => (
                      <td 
                        key={day} 
                        className="retention-cell"
                        style={{
                          backgroundColor: `rgba(26, 59, 93, ${value / 100})`,
                          color: value > 50 ? '#fff' : '#000'
                        }}
                      >
                        {value}%
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cohort-legend">
            <div className="legend-gradient"></div>
            <div className="legend-labels">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="retention-insights">
        <h3>Retention Insights</h3>
        <div className="insights-container">
          <div className="insight-card">
            <h4>First Day Drop</h4>
            <p>
              {data.retentionByDay && 
                `${100 - data.retentionByDay[0].retention}% of users don't return after their first interaction.`}
            </p>
          </div>
          <div className="insight-card">
            <h4>Retention Opportunity</h4>
            <p>
              {data.retentionByDay && data.retentionByDay.length > 3 &&
                `If Day 3 retention could be improved by 10%, we could retain approximately ${Math.round(data.totalUsers * 0.1)} more users.`}
            </p>
          </div>
          <div className="insight-card">
            <h4>Engaged Users</h4>
            <p>
              {data.retentionByDay && data.retentionByDay.length > 6 &&
                `${data.retentionByDay[6].retention}% of users are highly engaged, returning consistently for a week or more.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 