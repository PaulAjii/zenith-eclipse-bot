'use client';

import React from 'react';

interface MetricCardProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function MetricCard({ title, value, icon, trend }: MetricCardProps) {
  return (
    <div className="metric-card">
      <div className="metric-header">
        <h3>{title}</h3>
        {icon && <div className="metric-icon">{icon}</div>}
      </div>
      <div className="metric-value">{value}</div>
      {trend && (
        <div className={`metric-trend ${trend.isPositive ? 'positive' : 'negative'}`}>
          <span className="trend-arrow">
            {trend.isPositive ? '↑' : '↓'}
          </span>
          <span className="trend-value">{trend.value}%</span>
          <span className="trend-label">vs. previous</span>
        </div>
      )}
    </div>
  );
} 