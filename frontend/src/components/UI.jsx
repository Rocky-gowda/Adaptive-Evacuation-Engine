import React from 'react';

const severityColors = {
  low: 'bg-green-900 text-green-300 border-green-700',
  medium: 'bg-amber-900 text-amber-300 border-amber-700',
  high: 'bg-red-900 text-red-300 border-red-700',
  critical: 'bg-red-950 text-red-200 border-red-600',
};

const statusColors = {
  active: 'bg-red-900 text-red-300',
  resolved: 'bg-green-900 text-green-300',
  unverified: 'bg-slate-700 text-slate-300',
  open: 'bg-green-900 text-green-300',
  full: 'bg-red-900 text-red-300',
  closed: 'bg-slate-700 text-slate-300',
};

export function SeverityBadge({ severity }) {
  const cls = severityColors[severity] || severityColors.medium;
  return (
    <span className={`inline-block border text-xs font-bold px-2 py-0.5 rounded uppercase ${cls}`}>
      {severity}
    </span>
  );
}

export function StatusBadge({ status }) {
  const cls = statusColors[status] || statusColors.unverified;
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded uppercase ${cls}`}>
      {status}
    </span>
  );
}

export function FeasibilityBar({ score, showLabel = true }) {
  const color =
    score >= 75 ? 'bg-green-500' :
    score >= 50 ? 'bg-amber-500' :
    score >= 25 ? 'bg-orange-500' :
    'bg-red-500';
  return (
    <div>
      {showLabel && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-slate-400">Feasibility</span>
          <span className={`font-bold ${
            score >= 75 ? 'text-green-400' :
            score >= 50 ? 'text-amber-400' :
            score >= 25 ? 'text-orange-400' : 'text-red-400'
          }`}>{score}%</span>
        </div>
      )}
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.max(score, 2)}%` }}
        />
      </div>
    </div>
  );
}

export function StatCard({ title, value, subtitle, icon: Icon, color = 'blue', pulse = false }) {
  const colorMap = {
    red: 'border-red-700 bg-red-950',
    green: 'border-green-700 bg-green-950',
    blue: 'border-blue-700 bg-blue-950',
    amber: 'border-amber-700 bg-amber-950',
    purple: 'border-purple-700 bg-purple-950',
  };
  const textMap = {
    red: 'text-red-400',
    green: 'text-green-400',
    blue: 'text-blue-400',
    amber: 'text-amber-400',
    purple: 'text-purple-400',
  };
  return (
    <div className={`border rounded-lg p-4 ${colorMap[color]} ${pulse ? 'emergency-pulse' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{title}</span>
        {Icon && <Icon size={16} className={textMap[color]} />}
      </div>
      <div className={`text-2xl font-bold ${textMap[color]}`}>{value}</div>
      {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
    </div>
  );
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-lg p-4 ${className}`}>
      {children}
    </div>
  );
}

export function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-slate-400 text-sm">{text}</span>
    </div>
  );
}

export function ErrorMessage({ message }) {
  return (
    <div className="bg-red-950 border border-red-700 rounded-lg p-4 text-red-300 text-sm flex items-start gap-2">
      <span className="text-red-400 mt-0.5">⚠</span>
      <span>{message}</span>
    </div>
  );
}
