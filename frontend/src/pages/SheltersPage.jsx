import React, { useEffect, useState } from 'react';
import { Building2, RefreshCw } from 'lucide-react';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import { StatusBadge, Card, LoadingSpinner, ErrorMessage } from '../components/UI';

export default function SheltersPage() {
  const { userProfile } = useApp();
  const [shelters, setShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      setShelters(await api.getShelters());
    } catch {
      setError('Failed to load shelters. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const getAccessibilityScore = (s) => {
    let score = 0;
    if (s.wheelchair_accessible)  score += 30;
    if (s.has_ramp)                score += 20;
    if (s.has_accessible_entrance) score += 20;
    if (s.has_elevator)            score += 15;
    if (s.has_medical_support)     score += 15;
    return score;
  };

  const isMatchForUser = (s) => {
    if (!userProfile) return true;
    const mt = userProfile.mobility_type;
    if (mt === 'wheelchair') return s.wheelchair_accessible && s.has_ramp;
    if (mt === 'elderly')    return s.has_ramp || s.has_accessible_entrance;
    return true;
  };

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Building2 size={22} className="text-purple-400" />
            <div>
              <h1 className="text-white font-bold text-xl">Emergency Shelters</h1>
              <p className="text-slate-400 text-xs">Ranked by accessibility match for your profile</p>
            </div>
          </div>
          <button onClick={load} className="text-xs border border-slate-600 text-slate-400 hover:text-white px-3 py-1.5 rounded flex items-center gap-1">
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {error && <ErrorMessage message={error} />}
        {loading && <LoadingSpinner text="Loading shelters…" />}

        {!loading && (
          <div className="grid sm:grid-cols-2 gap-4">
            {shelters
              .sort((a, b) => getAccessibilityScore(b) - getAccessibilityScore(a))
              .map(shelter => {
                const score = getAccessibilityScore(shelter);
                const matched = isMatchForUser(shelter);
                const fillPct = Math.round((shelter.current_occupancy / Math.max(shelter.capacity, 1)) * 100);
                return (
                  <Card key={shelter.id} className={`relative ${matched && userProfile ? 'border-purple-700' : ''}`}>
                    {matched && userProfile && (
                      <div className="absolute top-2 right-2 text-xs bg-purple-700 text-white px-2 py-0.5 rounded font-semibold">
                        ✓ Matches Profile
                      </div>
                    )}
                    <div className="flex items-start gap-2 mb-3">
                      <span className="text-2xl">🏥</span>
                      <div>
                        <div className="text-white font-bold text-sm">{shelter.name}</div>
                        <StatusBadge status={shelter.status} />
                      </div>
                    </div>

                    {/* Capacity bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Occupancy</span>
                        <span className={fillPct > 90 ? 'text-red-400' : fillPct > 70 ? 'text-amber-400' : 'text-green-400'}>
                          {shelter.current_occupancy}/{shelter.capacity} ({fillPct}%)
                        </span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${fillPct > 90 ? 'bg-red-500' : fillPct > 70 ? 'bg-amber-500' : 'bg-green-500'}`}
                          style={{ width: `${fillPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Accessibility features */}
                    <div className="grid grid-cols-2 gap-1 text-xs mb-3">
                      {[
                        { label: 'Wheelchair',  val: shelter.wheelchair_accessible, icon: '♿' },
                        { label: 'Ramp',        val: shelter.has_ramp,              icon: '📐' },
                        { label: 'Accessible Entry', val: shelter.has_accessible_entrance, icon: '🚪' },
                        { label: 'Elevator',    val: shelter.has_elevator,          icon: '🛗' },
                        { label: 'Medical',     val: shelter.has_medical_support,   icon: '🏥' },
                      ].map(f => (
                        <div key={f.label} className={`flex items-center gap-1 rounded px-1.5 py-1 ${f.val ? 'text-green-300 bg-green-900/20' : 'text-slate-500 bg-slate-700/30'}`}>
                          <span>{f.icon}</span>
                          <span>{f.label}: {f.val ? '✓' : '✗'}</span>
                        </div>
                      ))}
                    </div>

                    {/* Accessibility score */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Accessibility Score</span>
                      <span className={`font-bold ${score >= 70 ? 'text-green-400' : score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                        {score}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>

                    {shelter.contact_number && (
                      <div className="mt-2 text-xs text-slate-400">📞 {shelter.contact_number}</div>
                    )}
                  </Card>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
