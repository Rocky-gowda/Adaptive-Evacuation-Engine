import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Zap, Map as MapIcon, AlertTriangle, Volume2, User, Info } from 'lucide-react';
import EvacMap from '../components/EvacMap';
import VoicePanel from '../components/VoicePanel';
import GuestMobilitySelector from '../components/GuestMobilitySelector';
import { useApp } from '../context/AppContext';
import { useVoice } from '../hooks/useVoice';
import { api } from '../api';
import { LoadingSpinner, ErrorMessage, Card } from '../components/UI';

export default function MapPage() {
  const {
    userProfile,
    activeProfile,
    hazards, setHazards,
    routes, setRoutes,
    shelters, setShelters,
    evacuationResult, setEvacuationResult,
    voiceEnabled,
    isOnline,
  } = useApp();
  const navigate = useNavigate();
  const { announceEvacuation, announceReroute, speak } = useVoice();

  const [loading, setLoading]         = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);
  const [error, setError]             = useState('');
  const [showHazards, setShowHazards] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showVoicePanel, setShowVoicePanel] = useState(false);
  const [backendDown, setBackendDown] = useState(false);

  // Demo location: start of routes
  const USER_LAT = 17.4950;
  const USER_LNG = 78.3891;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setBackendDown(false);
    try {
      const [h, r, s] = await Promise.all([
        api.getHazards(),
        api.getRoutes(),
        api.getShelters(),
      ]);
      setHazards(Array.isArray(h) ? h : []);
      setRoutes(Array.isArray(r) ? r : []);
      setShelters(Array.isArray(s) ? s : []);
      setError('');
    } catch {
      setBackendDown(true);
      setError(
        'Could not connect to the backend server. The map is still visible. ' +
        'Start the backend with: cd backend && python -m uvicorn app.main:app --port 8000'
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateRoute = async () => {
    if (!activeProfile) return;
    setCalcLoading(true);
    setError('');
    try {
      // Strip internal _isGuest flag before sending to API
      const { _isGuest, ...profileForApi } = activeProfile;
      const result = await api.calculateEvacuation({
        user_profile: profileForApi,
        current_lat: USER_LAT,
        current_lng: USER_LNG,
      });
      setEvacuationResult(result);
      // Announce via voice if enabled
      if (voiceEnabled) {
        announceEvacuation(result, activeProfile);
      }
    } catch {
      setError('Failed to calculate route. Is the backend running?');
    } finally {
      setCalcLoading(false);
    }
  };

  const recalculate = async () => {
    if (!activeProfile) return;
    setCalcLoading(true);
    setError('');
    try {
      const { _isGuest, ...profileForApi } = activeProfile;
      const result = await api.recalculateEvacuation({
        user_profile: profileForApi,
        current_lat: USER_LAT,
        current_lng: USER_LNG,
      });
      setEvacuationResult(result);
      if (voiceEnabled) {
        announceReroute(result);
      }
    } catch {
      setError('Re-routing failed. Is the backend running?');
    } finally {
      setCalcLoading(false);
    }
  };

  const recommendedId = evacuationResult?.recommended_route?.route_id || null;

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-screen-xl mx-auto px-4 py-4">

        {/* ── Offline banner ─────────────────────────────────────────────── */}
        {!isOnline && (
          <div
            className="mb-3 bg-amber-900/40 border border-amber-700 rounded-lg p-2.5 text-amber-300 text-xs flex items-center gap-2"
            role="alert"
            aria-live="assertive"
          >
            <AlertTriangle size={14} aria-hidden="true" />
            <strong>Offline mode</strong> — hazard information may be outdated. Map tiles may not load.
          </div>
        )}

        {/* ── Guest mode banner ──────────────────────────────────────────── */}
        {!userProfile && (
          <div
            className="mb-3 bg-blue-950/40 border border-blue-800 rounded-lg p-2.5 text-blue-300 text-xs flex items-center gap-2"
            role="status"
          >
            <Info size={14} aria-hidden="true" />
            <span>
              You are in <strong>Guest Mode</strong> — the map and route calculation are fully available.{' '}
              <a href="/profile" className="underline hover:text-blue-200">Create a saved profile</a> for
              persistent personalized recommendations.
            </span>
          </div>
        )}

        {/* ── Header row ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <h1 className="text-white font-bold text-xl flex items-center gap-2">
              <MapIcon size={20} className="text-blue-400" aria-hidden="true" />
              Evacuation Map
            </h1>
            <p className="text-slate-400 text-xs mt-0.5" aria-live="polite">
              {routes.length} routes · {hazards.length} active hazards · {shelters.length} shelters
              {activeProfile && (
                <span className="ml-2 text-blue-400">
                  · {activeProfile._isGuest ? '👤 Guest' : '👤'} {activeProfile.mobility_type?.replace(/_/g, ' ')}
                </span>
              )}
            </p>
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <button
              onClick={() => setShowHazards(h => !h)}
              aria-pressed={showHazards}
              aria-label={`${showHazards ? 'Hide' : 'Show'} hazard layer`}
              className={`text-xs px-3 py-1.5 rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500
                ${showHazards ? 'border-orange-600 bg-orange-900/30 text-orange-300' : 'border-slate-600 text-slate-400'}`}
            >
              🌊 Hazards {showHazards ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => setShowShelters(s => !s)}
              aria-pressed={showShelters}
              aria-label={`${showShelters ? 'Hide' : 'Show'} shelter layer`}
              className={`text-xs px-3 py-1.5 rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500
                ${showShelters ? 'border-purple-600 bg-purple-900/30 text-purple-300' : 'border-slate-600 text-slate-400'}`}
            >
              🏥 Shelters {showShelters ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={loadData}
              aria-label="Refresh map data"
              className="text-xs px-3 py-1.5 rounded border border-slate-600 text-slate-400 hover:text-white flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-slate-500"
            >
              <RefreshCw size={12} aria-hidden="true" /> Refresh
            </button>
            <button
              onClick={calculateRoute}
              disabled={calcLoading || backendDown}
              aria-label="Calculate feasible evacuation route"
              className="text-xs px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <Zap size={13} aria-hidden="true" />
              {calcLoading ? 'Calculating…' : 'Calculate Route'}
            </button>
            <button
              onClick={() => setShowVoicePanel(v => !v)}
              aria-label={showVoicePanel ? 'Hide voice assistance panel' : 'Open voice assistance panel'}
              aria-expanded={showVoicePanel}
              className={`text-xs px-3 py-1.5 rounded border flex items-center gap-1 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
                ${showVoicePanel ? 'border-blue-600 bg-blue-900/30 text-blue-300' : 'border-slate-600 text-slate-400 hover:text-white'}`}
            >
              <Volume2 size={13} aria-hidden="true" /> Voice
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-3" role="alert">
            <ErrorMessage message={error} />
          </div>
        )}

        {/* ── Map legend ─────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 mb-2 text-xs" role="list" aria-label="Map legend">
          {[
            { color: 'bg-blue-500',   label: 'Your Location'      },
            { color: 'bg-green-500',  label: 'Recommended Route'  },
            { color: 'bg-red-500',    label: 'Inaccessible Route' },
            { color: 'bg-blue-400',   label: 'Alternative Route'  },
            { color: 'bg-orange-500', label: 'Hazard Area'        },
            { color: 'bg-purple-500', label: 'Emergency Shelter'  },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5 text-slate-400" role="listitem">
              <span className={`w-3 h-3 rounded-full ${item.color}`} aria-hidden="true" />
              {item.label}
            </div>
          ))}
        </div>

        {/* ── Main content grid ──────────────────────────────────────────── */}
        <div className={`grid gap-4 ${showVoicePanel ? 'lg:grid-cols-[1fr_300px]' : 'grid-cols-1'}`}>
          {/* Map */}
          <div>
            {loading ? (
              <LoadingSpinner text="Loading map data…" />
            ) : (
              <EvacMap
                routes={routes}
                hazards={showHazards ? hazards : []}
                shelters={showShelters ? shelters : []}
                recommendedRouteId={recommendedId}
                userLat={USER_LAT}
                userLng={USER_LNG}
                height="540px"
              />
            )}

            {/* Route result banner */}
            {evacuationResult?.recommended_route && (
              <div
                className="mt-3 bg-green-950 border border-green-700 rounded-lg p-3"
                role="region"
                aria-label="Route recommendation"
                aria-live="polite"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="text-green-400 font-bold text-sm">
                      ✅ Recommended: {evacuationResult.recommended_route.route_name}
                    </div>
                    <div className="text-green-300 text-xs mt-0.5">
                      Feasibility: <strong>{evacuationResult.recommended_route.feasibility_score}%</strong>
                      {' · '}
                      {(evacuationResult.recommended_route.distance_m / 1000).toFixed(2)} km
                      {' · '}
                      ~{evacuationResult.recommended_route.estimated_time_min} min
                    </div>
                    <div className="text-slate-400 text-xs mt-0.5 italic">
                      Based on available hazard and accessibility data — not a safety guarantee.
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={recalculate}
                      disabled={calcLoading}
                      aria-label="Recalculate route with latest hazard data"
                      className="text-xs bg-amber-700 hover:bg-amber-600 text-white px-3 py-1.5 rounded flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <RefreshCw size={11} aria-hidden="true" /> Re-Route
                    </button>
                    <button
                      onClick={() => navigate('/analysis')}
                      aria-label="View full route analysis"
                      className="text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      Full Analysis →
                    </button>
                  </div>
                </div>
                {evacuationResult.rerouted && evacuationResult.reroute_reason && (
                  <div className="mt-2 text-amber-300 text-xs flex items-center gap-1" role="alert">
                    <AlertTriangle size={12} aria-hidden="true" />
                    {evacuationResult.reroute_reason}
                  </div>
                )}
              </div>
            )}

            {/* No result yet + no profile guidance */}
            {!evacuationResult && !calcLoading && (
              <div className="mt-3 bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-slate-400 text-sm text-center">
                {backendDown
                  ? 'Backend is not reachable — map is displayed from cache. Route calculation requires the backend.'
                  : 'Select a mobility type above and click "Calculate Route" to see a personalized feasible evacuation route.'
                }
              </div>
            )}
          </div>

          {/* Voice panel + Guest selector sidebar */}
          {showVoicePanel && (
            <aside aria-label="Voice and profile controls">
              <div className="space-y-4">
                {/* Guest mobility selector (full size) */}
                {!userProfile && <GuestMobilitySelector />}

                {/* Voice panel */}
                <VoicePanel
                  onNavigate={calculateRoute}
                  onReroute={recalculate}
                />
              </div>
            </aside>
          )}
        </div>

        {/* Show guest selector below map when voice panel is closed */}
        {!showVoicePanel && !userProfile && (
          <div className="mt-4 max-w-sm">
            <GuestMobilitySelector />
          </div>
        )}
      </div>
    </div>
  );
}
