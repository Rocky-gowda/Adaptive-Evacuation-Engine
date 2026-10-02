/**
 * GuestMobilitySelector — inline mobility profile picker for guest users.
 *
 * Stored in sessionStorage only. Never sent to the backend as a saved profile.
 * Allows guests to test person-specific routing without registration.
 */
import React, { useState } from 'react';
import { User, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';

const MOBILITY_OPTIONS = [
  { value: 'general',          label: 'General User',          icon: '🚶', short: 'General' },
  { value: 'wheelchair',       label: 'Wheelchair User',       icon: '♿', short: 'Wheelchair' },
  { value: 'elderly',          label: 'Elderly / Limited Walk', icon: '🧓', short: 'Elderly' },
  { value: 'walker',           label: 'Walker / Crutches',     icon: '🦯', short: 'Walker' },
  { value: 'temporary_injury', label: 'Temporary Injury',      icon: '🩹', short: 'Temp. Injury' },
];

// Auto-set sensible defaults per mobility type
const DEFAULTS = {
  wheelchair:       { cannot_use_stairs: true,  requires_ramp: true,  requires_low_gradient: true,  requires_wide_pathway: true  },
  elderly:          { cannot_use_stairs: false, requires_ramp: false, requires_low_gradient: true,  requires_wide_pathway: false },
  walker:           { cannot_use_stairs: true,  requires_ramp: true,  requires_low_gradient: false, requires_wide_pathway: false },
  temporary_injury: { cannot_use_stairs: false, requires_ramp: false, requires_low_gradient: false, requires_wide_pathway: false },
  general:          { cannot_use_stairs: false, requires_ramp: false, requires_low_gradient: false, requires_wide_pathway: false },
};

export default function GuestMobilitySelector({ compact = false }) {
  const { guestProfile, setGuestProfile, userProfile } = useApp();
  const [expanded, setExpanded] = useState(false);

  // If a real user profile exists, don't show guest selector
  if (userProfile) return null;

  const current = MOBILITY_OPTIONS.find(m => m.value === guestProfile.mobility_type) || MOBILITY_OPTIONS[0];

  const select = (value) => {
    setGuestProfile({
      ...guestProfile,
      mobility_type: value,
      ...DEFAULTS[value],
      name: 'Guest',
      requires_assistance: false,
    });
    setExpanded(false);
  };

  if (compact) {
    // Compact inline version for navbar / map toolbar
    return (
      <div className="relative">
        <button
          onClick={() => setExpanded(e => !e)}
          aria-label={`Guest mobility profile: ${current.label}. Click to change.`}
          aria-expanded={expanded}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-600 bg-slate-800 hover:border-slate-400 text-slate-300 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <span aria-hidden="true">{current.icon}</span>
          <span>{current.short}</span>
          {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>

        {expanded && (
          <div
            className="absolute top-full mt-1 right-0 z-50 bg-slate-800 border border-slate-600 rounded-xl shadow-xl min-w-[200px]"
            role="listbox"
            aria-label="Select mobility type"
          >
            <div className="p-2 border-b border-slate-700 text-xs text-slate-400 flex items-center gap-1">
              <User size={11} /> Guest Mode — session only
            </div>
            {MOBILITY_OPTIONS.map(m => (
              <button
                key={m.value}
                role="option"
                aria-selected={m.value === guestProfile.mobility_type}
                onClick={() => select(m.value)}
                className={`w-full text-left flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-slate-700
                  ${m.value === guestProfile.mobility_type ? 'text-blue-300 bg-blue-900/30' : 'text-slate-300'}`}
              >
                <span aria-hidden="true">{m.icon}</span>
                {m.label}
                {m.value === guestProfile.mobility_type && <span className="ml-auto text-xs text-blue-400">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full-size version for map page sidebar
  return (
    <div
      role="region"
      aria-label="Guest mobility profile selector"
      className="bg-slate-800 border border-slate-700 rounded-xl p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <User size={16} className="text-blue-400" />
        <span className="text-white font-semibold text-sm">Guest Mobility Profile</span>
        <span className="text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded ml-auto">Session only</span>
      </div>

      <div className="flex items-start gap-2 text-xs text-blue-300 bg-blue-950/30 border border-blue-900 rounded p-2 mb-3">
        <Info size={13} className="shrink-0 mt-0.5" aria-hidden="true" />
        <span>
          Selecting a profile affects route feasibility scores. No account required.
          <a href="/profile" className="ml-1 underline text-blue-400">Save permanently →</a>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-1.5">
        {MOBILITY_OPTIONS.map(m => (
          <button
            key={m.value}
            onClick={() => select(m.value)}
            aria-pressed={m.value === guestProfile.mobility_type}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
              ${m.value === guestProfile.mobility_type
                ? 'border-blue-600 bg-blue-900/30 text-white'
                : 'border-slate-700 bg-slate-700/20 text-slate-300 hover:border-slate-500'}`}
          >
            <span className="text-xl" aria-hidden="true">{m.icon}</span>
            <span className="font-medium">{m.label}</span>
            {m.value === guestProfile.mobility_type && (
              <span className="ml-auto text-xs text-blue-400 font-bold">Active</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
