'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import OverviewPanel from '../components/analytics/OverviewPanel';
import QualityPanel from '../components/analytics/QualityPanel';
import SessionsPanel from '../components/analytics/SessionsPanel';
import TopicsPanel from '../components/analytics/TopicsPanel';
import RetentionPanel from '../components/analytics/RetentionPanel';

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState(7); // default 7 days
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();
  
  return (
    <div className="analytics-dashboard">
      <header className="analytics-header">
        <div className="analytics-header-left">
          <div className="logo-container" onClick={() => router.push('/')}>
            <Image
              src="/images/Zenith-Eclipse-Logo.webp"
              alt="Zenith Eclipse Logo"
              width={48}
              height={48}
              className="logo-image"
            />
            <div className="logo-text">
              <div className="logo-name">ZENITH ECLIPSE</div>
              <div className="logo-co">CO</div>
            </div>
          </div>
          <h1>Analytics Dashboard</h1>
        </div>
        <div className="time-filter">
          <label>Time Range:</label>
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="time-select"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
        </div>
      </header>
      
      <div className="back-to-home">
        <button onClick={() => router.push('/')} className="back-button">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Home
        </button>
      </div>
      
      <nav className="dashboard-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''} 
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={activeTab === 'quality' ? 'active' : ''} 
          onClick={() => setActiveTab('quality')}
        >
          Conversation Quality
        </button>
        <button 
          className={activeTab === 'sessions' ? 'active' : ''} 
          onClick={() => setActiveTab('sessions')}
        >
          Sessions
        </button>
        <button 
          className={activeTab === 'topics' ? 'active' : ''} 
          onClick={() => setActiveTab('topics')}
        >
          Topics
        </button>
        <button 
          className={activeTab === 'retention' ? 'active' : ''} 
          onClick={() => setActiveTab('retention')}
        >
          User Retention
        </button>
      </nav>
      
      {isLoading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading analytics data...</p>
        </div>
      ) : (
        <div className="dashboard-content">
          {activeTab === 'overview' && (
            <OverviewPanel timeRange={timeRange} />
          )}
          {activeTab === 'quality' && (
            <QualityPanel timeRange={timeRange} />
          )}
          {activeTab === 'sessions' && (
            <SessionsPanel timeRange={timeRange} />
          )}
          {activeTab === 'topics' && (
            <TopicsPanel timeRange={timeRange} />
          )}
          {activeTab === 'retention' && (
            <RetentionPanel timeRange={timeRange} />
          )}
        </div>
      )}
    </div>
  );
} 