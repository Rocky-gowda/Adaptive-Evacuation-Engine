import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, CheckCircle, ChevronRight, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../api';
import { Card, ErrorMessage, LoadingSpinner } from '../components/UI';

const MOBILITY_TYPES = [
  { value: 'wheelchair',        label: 'Wheelchair User',       icon: '♿', desc: 'Full-time wheelchair user, requires fully accessible routes' },
  { value: 'elderly',           label: 'Elderly / Limited Walk', icon: '🧓', desc: 'Slower pace, cannot handle steep slopes or long distances' },
  { value: 'walker',            label: 'Walker / Crutches',      icon: '🦯', desc: 'Uses walking aid, stairs and uneven surfaces are difficult' },
  { value: 'temporary_injury',  label: 'Temporary Injury',       icon: '🩹', desc: 'Short-term mobility impairment, moderate accessibility needs' },
  { value: 'general',           label: 'General User',           icon: '🚶', desc: 'No special mobility requirements' },
];

const REQUIREMENTS = [
  { key: 'cannot_use_stairs',      label: 'Cannot use stairs',         icon: '🪜' },
  { key: 'requires_ramp',          label: 'Requires ramp',             icon: '📐' },
  { key: 'requires_low_gradient',  label: 'Requires low gradient',     icon: '⛰' },
  { key: 'requires_wide_pathway',  label: 'Requires wide pathway',     icon: '↔' },
  { key: 'requires_assistance',    label: 'Requires human assistance', icon: '🤝' },
];

// Default requirements per mobility type
const DEFAULTS = {
  wheelchair:       { cannot_use_stairs: true,  requires_ramp: true,  requires_low_gradient: true,  requires_wide_pathway: true,  requires_assistance: false },
  elderly:          { cannot_use_stairs: false, requires_ramp: false, requires_low_gradient: true,  requires_wide_pathway: false, requires_assistance: false },
  walker:           { cannot_use_stairs: true,  requires_ramp: true,  requires_low_gradient: false, requires_wide_pathway: false, requires_assistance: false },
  temporary_injury: { cannot_use_stairs: false, requires_ramp: false, requires_low_gradient: false, requires_wide_pathway: false, requires_assistance: false },
  general:          { cannot_use_stairs: false, requires_ramp: false, requires_low_gradient: false, requires_wide_pathway: false, requires_assistance: false },
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { setUserProfile } = useApp();
  const [name, setName] = useState('');
  const [mobility, setMobility] = useState('');
  const [reqs, setReqs] = useState({
    cannot_use_stairs: false,
    requires_ramp: false,
    requires_low_gradient: false,
    requires_wide_pathway: false,
    requires_assistance: false,
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectMobility = (type) => {
    setMobility(type);
    setReqs({ ...DEFAULTS[type] });
  };

  const toggleReq = (key) => setReqs(r => ({ ...r, [key]: !r[key] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!mobility) { setError('Please select a mobility type.'); return; }
    setError('');
    setLoading(true);
    try {
      const profile = await api.createProfile({
        name: name || 'Anonymous',
        mobility_type: mobility,
        ...reqs,
      });
      setUserProfile(profile);
      setSaved(true);
      setTimeout(() => navigate('/map'), 1000);
    } catch (err) {
      setError('Failed to save profile. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <User size={24} className="text-blue-400" />
          <div>
            <h1 className="text-white font-bold text-xl">Mobility Profile</h1>
            <p className="text-slate-400 text-sm">Your profile determines route feasibility scores</p>
          </div>
        </div>

        <div className="bg-blue-950/30 border border-blue-800 rounded-lg p-3 mb-6 flex gap-2 text-sm text-blue-300">
          <Info size={16} className="shrink-0 mt-0.5" />
          The same disaster situation produces <strong className="mx-1">different recommended routes</strong> for different
          users based on this profile.
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <Card>
            <label className="block text-slate-300 text-sm font-medium mb-2">Your Name (optional)</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </Card>

          {/* Mobility type */}
          <Card>
            <label className="block text-slate-300 text-sm font-semibold mb-3">Mobility Type *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MOBILITY_TYPES.map(m => (
                <button
                  type="button"
                  key={m.value}
                  onClick={() => selectMobility(m.value)}
                  className={`text-left px-4 py-3 rounded-lg border transition-all
                    ${mobility === m.value
                      ? 'border-blue-500 bg-blue-900/40 text-white'
                      : 'border-slate-600 bg-slate-700/30 text-slate-300 hover:border-slate-500'}`}
                >
                  <div className="text-xl mb-1">{m.icon}</div>
                  <div className="font-semibold text-sm">{m.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>
          </Card>

          {/* Requirements */}
          <Card>
            <label className="block text-slate-300 text-sm font-semibold mb-3">Accessibility Requirements</label>
            <div className="space-y-2">
              {REQUIREMENTS.map(r => (
                <label
                  key={r.key}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors
                    ${reqs[r.key] ? 'bg-blue-900/30 border border-blue-700' : 'hover:bg-slate-700/40'}`}
                >
                  <input
                    type="checkbox"
                    checked={reqs[r.key]}
                    onChange={() => toggleReq(r.key)}
                    className="w-4 h-4 accent-blue-500"
                  />
                  <span className="text-lg">{r.icon}</span>
                  <span className="text-sm text-slate-200">{r.label}</span>
                  {reqs[r.key] && <span className="ml-auto text-xs text-blue-400 font-medium">Active</span>}
                </label>
              ))}
            </div>
          </Card>

          {/* Profile preview */}
          {mobility && (
            <Card className="bg-slate-900">
              <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Profile Preview</div>
              <div className="text-white font-bold">
                {MOBILITY_TYPES.find(m => m.value === mobility)?.icon}{' '}
                {MOBILITY_TYPES.find(m => m.value === mobility)?.label}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {REQUIREMENTS.filter(r => reqs[r.key]).map(r => (
                  <span key={r.key} className="text-xs bg-blue-800 text-blue-200 px-2 py-0.5 rounded">
                    {r.icon} {r.label}
                  </span>
                ))}
                {REQUIREMENTS.filter(r => reqs[r.key]).length === 0 && (
                  <span className="text-xs text-slate-500">No special requirements</span>
                )}
              </div>
            </Card>
          )}

          {error && <ErrorMessage message={error} />}

          {saved ? (
            <div className="flex items-center gap-2 text-green-400 font-semibold">
              <CheckCircle size={20} />
              Profile saved! Redirecting to map…
            </div>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? 'Saving…' : (<><CheckCircle size={18} /> Save Profile & Continue <ChevronRight size={16} /></>)}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
