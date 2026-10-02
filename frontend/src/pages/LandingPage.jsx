import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, Map, User, Zap, ChevronRight, Activity, Volume2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { setDemoMode } = useApp();

  const startDemo = () => {
    setDemoMode(true);
    navigate('/demo');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-950/40 via-slate-950 to-blue-950/30 pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Shield size={64} className="text-red-500" aria-hidden="true" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full emergency-pulse" />
            </div>
          </div>

          <div className="inline-block bg-red-900/40 border border-red-700 text-red-300 text-xs font-bold px-3 py-1 rounded-full mb-4 tracking-widest">
            SMART INDIA HACKATHON — DISASTER MANAGEMENT
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4 tracking-tight">
            Adaptive Evacuation<br />
            <span className="text-red-400">Feasibility Engine</span>
          </h1>

          <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8">
            An intelligent disaster evacuation decision-support system that determines whether
            a route is <strong className="text-white">physically feasible for a specific person</strong> with
            functional mobility constraints and dynamically recommends the safest accessible route.
          </p>

          {/* Primary CTA: Guest access to map — no login required */}
          <div className="flex flex-wrap justify-center gap-4 mb-4">
            <button
              onClick={() => navigate('/map')}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3.5 rounded-xl flex items-center gap-2 transition-colors text-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label="Open emergency map — no login required"
            >
              <Map size={20} aria-hidden="true" /> Open Emergency Map
              <ChevronRight size={18} />
            </button>
          </div>

          <p className="text-slate-500 text-sm mb-8">
            No login required · Guest mode · Map visible immediately
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <button
              onClick={() => navigate('/profile')}
              className="border border-red-700 hover:border-red-500 text-red-300 hover:text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label="Create a saved mobility profile"
            >
              <User size={16} aria-hidden="true" /> Save Mobility Profile
            </button>
            <button
              onClick={startDemo}
              className="border border-amber-700 hover:border-amber-500 text-amber-300 hover:text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              aria-label="Start guided evacuation simulation demo"
            >
              <Zap size={16} aria-hidden="true" /> Run Evacuation Demo
            </button>
            <button
              onClick={() => { navigate('/map'); setTimeout(() => {}, 100); }}
              className="border border-blue-800 hover:border-blue-600 text-blue-400 hover:text-blue-200 px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Enable voice assistance for screen reader users"
            >
              <Volume2 size={16} aria-hidden="true" /> Voice Assistance
            </button>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <h2 className="text-center text-slate-400 text-sm font-bold tracking-widest uppercase mb-8">
          Core Innovations
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: '♿', color: 'border-blue-700 bg-blue-950/40',  title: 'Person-Specific Feasibility', desc: 'The same route gets a different feasibility score depending on the user\'s mobility profile. Wheelchair users, elderly, and general users receive different recommendations.' },
            { icon: '📊', color: 'border-green-700 bg-green-950/40', title: 'Transparent Scoring (0–100)', desc: 'Every route is scored based on stairs, slope, ramp availability, surface condition, flood risk, and blockages. The weights change per mobility type.' },
            { icon: '🌊', color: 'border-red-700 bg-red-950/40',    title: 'Dynamic Hazard Layer',      desc: 'Real-time hazard reporting for floods, blocked roads, landslides. The system automatically re-routes when conditions change.' },
            { icon: '🔄', color: 'border-amber-700 bg-amber-950/40', title: 'Auto Re-Routing',           desc: 'When a new hazard is reported on the recommended route, the system instantly recalculates and recommends the next best accessible route.' },
            { icon: '🏥', color: 'border-purple-700 bg-purple-950/40', title: 'Accessible Shelter Matching', desc: 'Shelters are ranked by accessibility features matching the user\'s needs — not just proximity. Wheelchair accessible, ramps, elevators, medical support.' },
            { icon: '💡', color: 'border-slate-700 bg-slate-800',    title: 'Explainable Decisions',     desc: 'Every recommendation shows exactly why a route was selected or rejected, with clear acceptance and rejection reasons in plain language.' },
          ].map(f => (
            <div key={f.title} className={`border rounded-xl p-5 ${f.color}`}>
              <div className="text-2xl mb-3">{f.icon}</div>
              <div className="font-bold text-white mb-1">{f.title}</div>
              <div className="text-slate-400 text-sm leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Demo scenario preview */}
        <div className="mt-12 bg-slate-900 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} className="text-amber-400" />
            <span className="font-bold text-amber-400 text-sm uppercase tracking-wider">Demo Scenario</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 text-sm">
            <div>
              <div className="text-red-400 font-semibold mb-2">❌ Route A (Rejected)</div>
              <ul className="text-slate-400 space-y-1">
                <li>📏 Distance: 1.2 km (shorter)</li>
                <li>🪜 Stairs: <span className="text-red-400">Yes → -40 pts for wheelchair</span></li>
                <li>📐 Slope: 12% <span className="text-red-400">Steep → -20 pts</span></li>
                <li>🌊 Flood: High severity <span className="text-red-400">→ -18 pts</span></li>
                <li className="text-red-300 font-bold">Feasibility: ~22%</li>
              </ul>
            </div>
            <div>
              <div className="text-green-400 font-semibold mb-2">✅ Route B (Recommended)</div>
              <ul className="text-slate-400 space-y-1">
                <li>📏 Distance: 1.8 km (longer)</li>
                <li>♿ No stairs, ramp available</li>
                <li>📐 Slope: 4% — acceptable</li>
                <li>🌊 No active hazards</li>
                <li className="text-green-300 font-bold">Feasibility: ~88%</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 text-center">
            <button
              onClick={startDemo}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-8 py-2.5 rounded-lg inline-flex items-center gap-2 transition-colors"
            >
              <Zap size={16} /> Run This Demo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
