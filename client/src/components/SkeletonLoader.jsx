import { useState } from 'react';

/**
 * SkeletonLoader — animated placeholder while data is loading.
 * Usage: <SkeletonLoader type="card" /> | <SkeletonLoader type="row" count={5} />
 */
export function SkeletonBlock({ width = '100%', height = 14, className = '' }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height: `${height}px` }}
    />
  );
}

export function SkeletonStatCard() {
  return (
    <div className="card">
      <SkeletonBlock width="60%" height={12} />
      <div style={{ marginTop: 10 }}>
        <SkeletonBlock width="80%" height={32} />
      </div>
      <div style={{ marginTop: 8 }}>
        <SkeletonBlock width="40%" height={13} />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <tr>
      {[...Array(7)].map((_, i) => (
        <td key={i} style={{ padding: '16px' }}>
          <SkeletonBlock width={i === 0 ? '80%' : '60%'} height={14} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonChart({ height = 250 }) {
  return (
    <div className="skeleton skeleton-chart" style={{ height: `${height}px`, borderRadius: 'var(--radius-md)' }} />
  );
}

export function SkeletonHoldingsTable({ rows = 5 }) {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            {['Stock', 'Qty', 'Avg Price', 'Current', 'Invested', 'Value', 'P&L', 'P&L %'].map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(rows)].map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SkeletonLoader({ type = 'card', count = 1 }) {
  if (type === 'stat-grid') {
    return (
      <div className="grid-stats">
        {[...Array(4)].map((_, i) => <SkeletonStatCard key={i} />)}
      </div>
    );
  }
  if (type === 'chart') return <SkeletonChart />;
  if (type === 'table') return <SkeletonHoldingsTable rows={count} />;
  return <SkeletonStatCard />;
}
