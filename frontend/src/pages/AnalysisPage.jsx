import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Zap, RefreshCw, AlertTriangle, ChevronDown, ChevronUp, Volume2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useVoice } from '../hooks/useVoice';
import { api } from '../api';
import { FeasibilityBar, SeverityBadge, Card, LoadingSpinner, ErrorMessage } from '../components/UI';

function RouteCard({ route, isRecommended, isExpanded, onToggle }) {
  const score = route.feasibility_score;
  const borderColor =
    isRecommended ? 'border-green-600' :
    score < 40    ? 'border-red-700'  : 'border-slate-700';
  const bgColor =
    isRecommended ? 'bg-green-950/40' :
    score < 40    ? 'bg-red-950/20'   : 'bg-slate-800';

  return (
    <div className={`border rounded-xl ${borderColor} ${bgColor} overflow-hidden`}>
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {isRecommended
            ? <span className="text-2xl">✅</span>
            : score < 40
              ? <span className="text-2xl">❌</span>
              : <span className="text-2xl">⚠️</span>
          }
          <div>
            <div className="text-white font-bold text-sm">{route.route_name}</div>
            <div className="text-slate-400 text-xs">
              {(route.distance_m / 1000).toFixed(2)} km · ~{route.estimated_time_min} min
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block min-w-[120px]">
            <FeasibilityBar score={score} />
          </div>
          {isRecommended && (
            <span className="text-xs bg-green-700 text-white px-2 py-0.5 rounded font-bold">
              RECOMMENDED
            </span>
          )}
          {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-slate-700/50 mt-1 pt-3">
          <div className="sm:hidden mb-3">
            <FeasibilityBar score={score} />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
            {[
              { label: 'Stairs',   value: route.accessibility_flags?.has_stairs ? '⚠ Yes' : '✓ None',  ok: !route.accessibility_flags?.has_stairs },
              { label: 'Ramp',     value: route.accessibility_flags?.has_ramp   ? '✓ Yes' : '✗ None',  ok: route.accessibility_flags?.has_ramp    },
              { label: 'Slope',    value: `${route.accessibility_flags?.max_slope_percent ?? '?'}%`,     ok: (route.accessibility_flags?.max_slope_percent ?? 99) <= 8 },
              { label: 'Width',    value: `${route.accessibility_flags?.min_width_m ?? '?'} m`,          ok: (route.accessibility_flags?.min_width_m ?? 0) >= 1.5    },
              { label: 'Surface',  value: route.accessibility_flags?.surface_condition ?? '?',           ok: route.accessibility_flags?.surface_condition === 'good' },
              { label: 'Hazards',  value: route.hazard_details?.length ? `${route.hazard_details.length} active` : 'None', ok: !route.hazard_details?.length },
            ].map(s => (
              <div key={s.label} className={`rounded p-2 text-center ${s.ok ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                <div className={`font-bold ${s.ok ? 'text-green-300' : 'text-red-300'}`}>{s.value}</div>
                <div className="text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Accepted reasons */}
          {route.reasons_accepted?.length > 0 && (
            <div className="mb-3">
              <div className="text-green-400 text-xs font-semibold mb-1">Why this route works:</div>
              <ul className="space-y-0.5">
                {route.reasons_accepted.map((r, i) => (
                  <li key={i} className="text-green-300 text-xs flex items-center gap-1.5">
                    <span>✓</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rejected reasons */}
          {route.reasons_rejected?.length > 0 && (
            <div>
              <div className="text-red-400 text-xs font-semibold mb-1">Issues detected:</div>
              <ul className="space-y-0.5">
                {route.reasons_rejected.map((r, i) => (
                  <li key={i} className="text-red-300 text-xs flex items-center gap-1.5">
                    <span>✗</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Hazard details */}
          {route.hazard_details?.length > 0 && (
            <div className="mt-3 space-y-1">
              <div className="text-amber-400 text-xs font-semibold">Active hazards on this route:</div>
              {route.hazard_details.map((h, i) => (
                <div key={i} className="text-xs bg-amber-900/30 border border-amber-800 rounded px-2 py-1 flex items-center gap-2">
                  <span>⚠</span>
                  <span className="text-amber-300">{h.type?.replace(/_/g, ' ').toUpperCase()}</span>
                  <SeverityBadge severity={h.severity} />
                  <span className="text-slate-400">{Math.round(h.confidence * 100)}% confidence</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AnalysisPage() {
  const { activeProfile, userProfile, evacuationResult, setEvacuationResult, voiceEnabled } = useApp();
  const { announceEvacuation, announceReroute, speakForce, ttsSupported } = useVoice();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(new Set([0]));

  const USER_LAT = 17.4950;
  const USER_LNG = 78.3891;

  const toggle = (i) => setExpanded(s => {
    const n = new Set(s);
    n.has(i) ? n.delete(i) : n.add(i);
    return n;
  });

  const runAnalysis = async () => {
    if (!activeProfile) return;
    setLoading(true); setError('');
    try {
      const { _isGuest, ...profileForApi } = activeProfile;
      const result = await api.calculateEvacuation({
        user_profile: profileForApi,
        current_lat: USER_LAT,
        current_lng: USER_LNG,
      });
      setEvacuationResult(result);
      setExpanded(new Set([0]));
      if (voiceEnabled) announceEvacuation(result, activeProfile);
    } catch {
      setError('Analysis failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const runReroute = async () => {
    if (!activeProfile) return;
    setLoading(true); setError('');
    try {
      const { _isGuest, ...profileForApi } = activeProfile;
      const result = await api.recalculateEvacuation({
        user_profile: profileForApi,
        current_lat: USER_LAT,
        current_lng: USER_LNG,
      });
      setEvacuationResult(result);
      if (voiceEnabled) announceReroute(result);
    } catch {
      setError('Rerouting failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const speakAnalysis = () => {
    if (!ttsSupported) { alert('Voice assistance is not supported by this browser.'); return; }
    if (evacuationResult) {
      announceEvacuation(evacuationResult, activeProfile);
    } else {
      speakForce('No route has been calculated yet. Please click Calculate first.');
    }
  };

  const routes = evacuationResult?.all_routes || [];

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Activity size={22} className="text-blue-400" />
            <div>
              <h1 className="text-white font-bold text-xl">Route Analysis</h1>
              <p className="text-slate-400 text-xs">Person-specific feasibility scoring</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={runAnalysis}
              disabled={loading}
              aria-label="Calculate feasibility for all routes"
              className="text-sm bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <Zap size={14} aria-hidden="true" /> {loading ? 'Calculating…' : 'Calculate'}
            </button>
            <button
              onClick={runReroute}
              disabled={loading}
              aria-label="Recalculate with latest hazard data"
              className="text-sm bg-amber-600 hover:bg-amber-500 text-black font-semibold px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <RefreshCw size={14} aria-hidden="true" /> Re-Route
            </button>
            <button
              onClick={speakAnalysis}
              aria-label="Speak route analysis using voice assistance"
              className="text-sm border border-blue-700 bg-blue-900/30 hover:bg-blue-900/60 text-blue-300 px-4 py-2 rounded-lg flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <Volume2 size={14} aria-hidden="true" /> Speak
            </button>
          </div>
        </div>

        {error && <div className="mb-4"><ErrorMessage message={error} /></div>}

        {/* Profile Banner — shows for both registered and guest users */}
        {activeProfile && (
          <Card className="mb-4 bg-blue-950/30 border-blue-800">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">Active Profile:</span>
              <span className="text-white font-semibold">
                {activeProfile.mobility_type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
              {activeProfile._isGuest && (
                <span className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">Guest</span>
              )}
              <div className="flex flex-wrap gap-1 ml-2">
                {activeProfile.cannot_use_stairs     && <span className="text-xs bg-blue-800 text-blue-200 px-1.5 py-0.5 rounded">No Stairs</span>}
                {activeProfile.requires_ramp          && <span className="text-xs bg-blue-800 text-blue-200 px-1.5 py-0.5 rounded">Ramp</span>}
                {activeProfile.requires_low_gradient  && <span className="text-xs bg-blue-800 text-blue-200 px-1.5 py-0.5 rounded">Low Slope</span>}
                {activeProfile.requires_wide_pathway  && <span className="text-xs bg-blue-800 text-blue-200 px-1.5 py-0.5 rounded">Wide Path</span>}
              </div>
            </div>
          </Card>
        )}

        {/* Reroute notice */}
        {evacuationResult?.rerouted && evacuationResult?.reroute_reason && (
          <div className="mb-4 bg-amber-950/40 border border-amber-700 rounded-lg p-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-400 shrink-0" />
            <span className="text-amber-300 text-sm">{evacuationResult.reroute_reason}</span>
          </div>
        )}

        {/* Summary */}
        {evacuationResult?.summary && (
          <Card className="mb-4">
            <p className="text-slate-300 text-sm">{evacuationResult.summary}</p>
          </Card>
        )}

        {loading && <LoadingSpinner text="Calculating feasibility scores…" />}

        {!loading && routes.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <Activity size={40} className="mx-auto mb-3 opacity-30" />
            <p>Click "Calculate" to run the feasibility analysis</p>
            <p className="text-xs text-slate-600 mt-1">
              Guest mode active — no login required to calculate routes.{' '}
              <a href="/profile" className="text-blue-500 underline">Save a profile</a> for persistent recommendations.
            </p>
          </div>
        )}

        {/* Route cards */}
        {!loading && routes.length > 0 && (
          <div className="space-y-3">
            <div className="text-slate-400 text-xs uppercase font-semibold tracking-wider mb-1">
              {routes.length} candidate routes analysed
            </div>
            {routes.map((route, i) => (
              <RouteCard
                key={route.route_id}
                route={route}
                isRecommended={evacuationResult?.recommended_route?.route_id === route.route_id}
                isExpanded={expanded.has(i)}
                onToggle={() => toggle(i)}
              />
            ))}
          </div>
        )}

        {/* Shelter recommendation */}
        {evacuationResult?.recommended_shelter && (
          <div className="mt-6 bg-purple-950/40 border border-purple-700 rounded-xl p-4">
            <div className="text-purple-400 font-bold text-sm mb-2">🏥 Recommended Shelter</div>
            <div className="text-white font-bold">{evacuationResult.recommended_shelter.name}</div>
            <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
              {[
                { label: 'Accessibility Score',   value: `${evacuationResult.recommended_shelter.accessibility_score}%`, ok: true },
                { label: 'Capacity Available',    value: `${evacuationResult.recommended_shelter.availability_pct}%`, ok: evacuationResult.recommended_shelter.availability_pct > 20 },
                { label: 'Medical Support',       value: evacuationResult.recommended_shelter.has_medical_support ? 'Yes' : 'No', ok: evacuationResult.recommended_shelter.has_medical_support },
                { label: 'Wheelchair Accessible', value: evacuationResult.recommended_shelter.wheelchair_accessible ? 'Yes' : 'No', ok: evacuationResult.recommended_shelter.wheelchair_accessible },
                { label: 'Ramp',                  value: evacuationResult.recommended_shelter.has_ramp ? 'Yes' : 'No', ok: evacuationResult.recommended_shelter.has_ramp },
                { label: 'Elevator',              value: evacuationResult.recommended_shelter.has_elevator ? 'Yes' : 'No', ok: evacuationResult.recommended_shelter.has_elevator },
              ].map(s => (
                <div key={s.label} className={`rounded p-2 text-center ${s.ok ? 'bg-green-900/30' : 'bg-red-900/20'}`}>
                  <div className={`font-bold ${s.ok ? 'text-green-300' : 'text-red-300'}`}>{s.value}</div>
                  <div className="text-slate-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
