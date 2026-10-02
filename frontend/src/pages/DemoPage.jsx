import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, ChevronRight, CheckCircle } from 'lucide-react';
import { api } from '../api';
import { useApp } from '../context/AppContext';
import EvacMap from '../components/EvacMap';
import { FeasibilityBar, Card, LoadingSpinner, ErrorMessage } from '../components/UI';

const DEMO_STEPS = [
  { title: 'Select User Profile',         desc: 'Choose a wheelchair user profile to demonstrate person-specific routing.' },
  { title: 'View Starting Location',      desc: 'The user is at the campus main entrance. Two evacuation routes are available.' },
  { title: 'Calculate Feasibility',       desc: 'System scores each route based on mobility requirements and current conditions.' },
  { title: 'Route A Rejected',            desc: 'Route A: Stairs + steep slope + flooding → Feasibility ~22% for wheelchair user.' },
  { title: 'Route B Recommended',         desc: 'Route B: No stairs, ramp, gentle slope, no hazards → Feasibility ~88%.' },
  { title: 'Add New Flood to Route B',    desc: 'A new flood is reported on Route B. System must re-route.' },
  { title: 'System Recalculates',         desc: 'Feasibility re-scored with the new hazard applied to Route B.' },
  { title: 'New Route Recommended',       desc: 'Route C becomes the new recommendation or alert for assisted evacuation.' },
  { title: 'Accessible Shelter Matched',  desc: 'System recommends the shelter best suited for the wheelchair user\'s needs.' },
];

export default function DemoPage() {
  const { setUserProfile, setEvacuationResult, setDemoMode, setHazards, setRoutes, setShelters } = useApp();
  const navigate = useNavigate();

  const [step, setStep] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [demoHazards, setDemoHazards] = useState([]);
  const [routes, setLocalRoutes] = useState([]);
  const [shelters, setLocalShelters] = useState([]);
  const [addedHazardId, setAddedHazardId] = useState(null);
  const [demoProfile, setDemoProfile] = useState(null);

  const USER_LAT = 17.4950;
  const USER_LNG = 78.3891;

  const wheelchairProfileData = {
    name: 'Demo Wheelchair User',
    mobility_type: 'wheelchair',
    cannot_use_stairs: true,
    requires_ramp: true,
    requires_low_gradient: true,
    requires_wide_pathway: true,
    requires_assistance: false,
  };

  const runStep = async (stepIndex) => {
    setError('');
    setLoading(true);

    try {
      if (stepIndex === 0) {
        // Step 1: create wheelchair profile
        const profile = await api.createProfile(wheelchairProfileData);
        setDemoProfile(profile);
        setUserProfile(profile);
        const [r, h, s] = await Promise.all([api.getRoutes(), api.getHazards(), api.getShelters()]);
        setLocalRoutes(r); setRoutes(r);
        setDemoHazards(h); setHazards(h);
        setLocalShelters(s); setShelters(s);
        setStep(0);
      } else if (stepIndex === 1) {
        // Step 2: show map
        setStep(1);
      } else if (stepIndex === 2) {
        // Step 3: calculate
        const profile = demoProfile || wheelchairProfileData;
        const r = await api.calculateEvacuation({ user_profile: profile, current_lat: USER_LAT, current_lng: USER_LNG });
        setResult(r);
        setEvacuationResult(r);
        setStep(2);
      } else if (stepIndex === 3) {
        setStep(3);
      } else if (stepIndex === 4) {
        setStep(4);
      } else if (stepIndex === 5) {
        // Add flood to Route B area
        // Two floods placed exactly on Route B's unique waypoints (west arc)
        const newHazard = await api.createHazard({
          hazard_type: 'flood',
          latitude: 17.4965,
          longitude: 78.3882,
          severity: 'critical',
          description: 'DEMO: Flash flood on Route B west arc — campus ring road flooded',
          confidence: 0.99,
          reported_by: 'authority',
          radius_m: 180,
          status: 'active',
        });
        await api.createHazard({
          hazard_type: 'flood',
          latitude: 17.4978,
          longitude: 78.3900,
          severity: 'critical',
          description: 'DEMO: Flash flood on Route B north arc',
          confidence: 0.99,
          reported_by: 'authority',
          radius_m: 180,
          status: 'active',
        });
        setAddedHazardId(newHazard.id);
        const updatedHazards = await api.getHazards();
        setDemoHazards(updatedHazards); setHazards(updatedHazards);
        setStep(5);
      } else if (stepIndex === 6) {
        // Recalculate
        const profile = demoProfile || wheelchairProfileData;
        const r = await api.recalculateEvacuation({ user_profile: profile, current_lat: USER_LAT, current_lng: USER_LNG });
        setResult(r);
        setEvacuationResult(r);
        setStep(6);
      } else if (stepIndex === 7) {
        setStep(7);
      } else if (stepIndex === 8) {
        setStep(8);
      }
    } catch (e) {
      setError('Demo step failed. Is the backend running?');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => runStep(step + 1);

  const resetDemo = async () => {
    setStep(-1); setResult(null); setDemoHazards([]); setAddedHazardId(null); setDemoProfile(null);
    if (addedHazardId) {
      try { await api.deleteHazard(addedHazardId); } catch {}
    }
  };

  const startDemo = () => {
    setDemoMode(true);
    runStep(0);
  };

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">Interactive Demo</div>
          <h1 className="text-white text-3xl font-extrabold mb-2">
            <Zap className="inline text-amber-400 mr-2" size={28} />
            Evacuation Simulation
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Watch how the system routes a wheelchair user during a dynamic disaster scenario — including automatic re-routing when conditions change.
          </p>
        </div>

        {/* Step progress */}
        <div className="flex flex-wrap gap-1 mb-6 justify-center">
          {DEMO_STEPS.map((s, i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                ${i < step ? 'bg-green-600 text-white' :
                  i === step ? 'bg-amber-500 text-black' :
                  'bg-slate-700 text-slate-400'}`}
            >
              {i < step ? '✓' : i + 1}
            </div>
          ))}
        </div>

        {error && <ErrorMessage message={error} />}

        {step === -1 ? (
          <div className="text-center py-8">
            <button
              onClick={startDemo}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-lg px-10 py-4 rounded-xl flex items-center gap-3 mx-auto transition-colors"
            >
              <Zap size={22} /> Start Evacuation Simulation
            </button>
            <p className="text-slate-500 text-xs mt-3">
              Requires backend to be running on localhost:8000
            </p>
          </div>
        ) : (
          <>
            {/* Current step card */}
            {step >= 0 && step < DEMO_STEPS.length && (
              <Card className="mb-4 border-amber-800 bg-amber-950/20">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-500 text-black rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                    {step + 1}
                  </div>
                  <div>
                    <div className="text-amber-300 font-bold">{DEMO_STEPS[step].title}</div>
                    <div className="text-slate-400 text-sm mt-0.5">{DEMO_STEPS[step].desc}</div>
                  </div>
                </div>
              </Card>
            )}

            {/* Map */}
            {step >= 1 && (
              <Card className="mb-4 p-0 overflow-hidden">
                <div className="p-2 border-b border-slate-700 text-xs text-slate-400">
                  🗺 Live Map — {demoHazards.length} hazard(s) active
                </div>
                <EvacMap
                  routes={routes}
                  hazards={demoHazards}
                  shelters={shelters}
                  recommendedRouteId={result?.recommended_route?.route_id}
                  userLat={USER_LAT}
                  userLng={USER_LNG}
                  height="380px"
                />
              </Card>
            )}

            {/* Profile display */}
            {step >= 0 && (
              <Card className="mb-4">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  USER PROFILE → ACCESSIBILITY REQUIREMENTS → CURRENT HAZARDS
                </div>
                <div className="grid sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-blue-950/40 border border-blue-800 rounded p-2">
                    <div className="text-blue-400 font-bold mb-1">User Profile</div>
                    <div className="text-white">♿ Wheelchair User</div>
                  </div>
                  <div className="bg-slate-700/40 rounded p-2">
                    <div className="text-slate-300 font-bold mb-1">Accessibility Needs</div>
                    <ul className="text-slate-400 space-y-0.5">
                      <li>✓ No stairs</li>
                      <li>✓ Ramp required</li>
                      <li>✓ Low gradient</li>
                      <li>✓ Wide pathway</li>
                    </ul>
                  </div>
                  <div className="bg-red-950/30 border border-red-900 rounded p-2">
                    <div className="text-red-400 font-bold mb-1">Active Hazards</div>
                    {demoHazards.length === 0
                      ? <div className="text-slate-400">None yet</div>
                      : demoHazards.map(h => (
                          <div key={h.id} className="text-red-300 text-xs">
                            🌊 {h.hazard_type.replace(/_/g, ' ')} — {h.severity}
                          </div>
                        ))
                    }
                  </div>
                </div>
              </Card>
            )}

            {/* Route analysis results */}
            {result && step >= 2 && (
              <Card className="mb-4">
                <div className="text-slate-300 font-semibold text-sm mb-3">
                  Route Analysis → Feasibility Score → Recommended Route
                </div>
                {result.rerouted && result.reroute_reason && (
                  <div className="mb-3 bg-amber-900/30 border border-amber-700 rounded p-2 text-amber-300 text-xs">
                    🔄 {result.reroute_reason}
                  </div>
                )}
                <div className="space-y-3">
                  {result.all_routes?.map(r => (
                    <div key={r.route_id} className={`rounded-lg p-3 border
                      ${result.recommended_route?.route_id === r.route_id
                        ? 'border-green-600 bg-green-950/30'
                        : r.feasibility_score < 40
                          ? 'border-red-800 bg-red-950/20'
                          : 'border-slate-700'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-bold text-sm">{r.route_name}</span>
                        {result.recommended_route?.route_id === r.route_id && (
                          <span className="text-xs bg-green-700 text-white px-2 py-0.5 rounded font-bold">RECOMMENDED</span>
                        )}
                        {r.feasibility_score < 40 && (
                          <span className="text-xs bg-red-800 text-red-200 px-2 py-0.5 rounded font-bold">REJECTED</span>
                        )}
                      </div>
                      <FeasibilityBar score={r.feasibility_score} />
                      <div className="mt-2 flex flex-wrap gap-1">
                        {r.reasons_accepted?.slice(0, 2).map((x, i) => (
                          <span key={i} className="text-xs text-green-300 bg-green-900/30 px-1.5 py-0.5 rounded">✓ {x}</span>
                        ))}
                        {r.reasons_rejected?.slice(0, 2).map((x, i) => (
                          <span key={i} className="text-xs text-red-300 bg-red-900/30 px-1.5 py-0.5 rounded">✗ {x}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Shelter */}
            {result?.recommended_shelter && step >= 8 && (
              <Card className="mb-4 border-purple-700 bg-purple-950/20">
                <div className="text-purple-400 font-bold text-sm mb-2">
                  ↓ Accessible Shelter Matched
                </div>
                <div className="text-white font-bold">{result.recommended_shelter.name}</div>
                <div className="flex gap-4 mt-2 text-xs text-slate-400">
                  <span>♿ Wheelchair: {result.recommended_shelter.wheelchair_accessible ? '✓' : '✗'}</span>
                  <span>📐 Ramp: {result.recommended_shelter.has_ramp ? '✓' : '✗'}</span>
                  <span>🏥 Medical: {result.recommended_shelter.has_medical_support ? '✓' : '✗'}</span>
                  <span>Accessibility: {result.recommended_shelter.accessibility_score}%</span>
                </div>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center mt-6">
              <button
                onClick={resetDemo}
                className="text-sm border border-slate-600 text-slate-400 hover:text-white px-4 py-2 rounded-lg"
              >
                Reset Demo
              </button>
              <div className="flex gap-2">
                {step < DEMO_STEPS.length - 1 ? (
                  <button
                    onClick={nextStep}
                    disabled={loading}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-60"
                  >
                    {loading ? 'Running…' : (<>Next Step <ChevronRight size={16} /></>)}
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-green-400 font-bold">
                    <CheckCircle size={20} /> Demo Complete!
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
