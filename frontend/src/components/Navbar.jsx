import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Shield, Map, User, AlertTriangle, Building2,
  LayoutDashboard, Activity, Zap, Volume2, VolumeX, Wifi, WifiOff
} from 'lucide-react';
import GuestMobilitySelector from './GuestMobilitySelector';

const navItems = [
  { to: '/',          icon: Shield,          label: 'Home'       },
  { to: '/map',       icon: Map,             label: 'Evac Map'   },
  { to: '/profile',   icon: User,            label: 'My Profile' },
  { to: '/analysis',  icon: Activity,        label: 'Analysis'   },
  { to: '/shelters',  icon: Building2,       label: 'Shelters'   },
  { to: '/report',    icon: AlertTriangle,   label: 'Report'     },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Authority'  },
  { to: '/demo',      icon: Zap,             label: 'Demo'       },
];

export default function Navbar() {
  const { userProfile, demoMode, setDemoMode, voiceEnabled, setVoiceEnabled, isOnline } = useApp();
  const navigate = useNavigate();

  const toggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    if (next && 'speechSynthesis' in window) {
      const utt = new SpeechSynthesisUtterance('Voice assistance enabled.');
      utt.rate = 0.95;
      window.speechSynthesis.speak(utt);
    } else if (!next) {
      window.speechSynthesis?.cancel?.();
    }
  };

  return (
    <nav
      className="bg-slate-900 border-b border-slate-700 sticky top-0 z-50"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Brand */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/')}
          role="link"
          aria-label="Adaptive Evacuation Feasibility Engine — Home"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && navigate('/')}
        >
          <Shield className="text-red-500" size={22} aria-hidden="true" />
          <span className="text-white font-bold text-sm tracking-wide hidden sm:block">
            EVAC<span className="text-red-400">FEASIBILITY</span>
          </span>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-1" role="menubar">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              role="menuitem"
              aria-label={label}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors
                focus:outline-none focus:ring-2 focus:ring-blue-500
                ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`
              }
            >
              <Icon size={13} aria-hidden="true" />
              <span className="hidden md:block">{label}</span>
            </NavLink>
          ))}
        </div>

        {/* Right strip */}
        <div className="flex items-center gap-2">
          {/* Offline indicator */}
          {!isOnline && (
            <span
              className="text-xs bg-amber-800 border border-amber-600 text-amber-200 px-2 py-0.5 rounded flex items-center gap-1"
              role="alert"
              aria-live="assertive"
              title="Offline — hazard data may be outdated"
            >
              <WifiOff size={11} aria-hidden="true" /> Offline
            </span>
          )}

          {/* Demo badge */}
          {demoMode && (
            <span className="text-xs bg-amber-500 text-black px-2 py-0.5 rounded font-bold animate-pulse">
              DEMO
            </span>
          )}

          {/* User/Guest identity */}
          {userProfile ? (
            <span className="text-xs text-slate-400 hidden lg:flex items-center gap-1">
              <User size={11} aria-hidden="true" />
              {userProfile.mobility_type?.replace(/_/g, ' ').toUpperCase()}
            </span>
          ) : (
            /* Guest mobility picker (compact) */
            <GuestMobilitySelector compact />
          )}

          {/* Voice toggle */}
          <button
            onClick={toggleVoice}
            aria-label={voiceEnabled ? 'Voice assistance is ON — click to disable' : 'Enable voice assistance'}
            aria-pressed={voiceEnabled}
            title={voiceEnabled ? 'Voice ON' : 'Voice OFF'}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
              ${voiceEnabled
                ? 'bg-blue-700 text-blue-200 border border-blue-600'
                : 'border border-slate-600 text-slate-400 hover:text-white'}`}
          >
            {voiceEnabled
              ? <Volume2 size={13} aria-hidden="true" />
              : <VolumeX size={13} aria-hidden="true" />}
            <span className="hidden sm:block">{voiceEnabled ? 'Voice ON' : 'Voice'}</span>
          </button>

          {/* Demo mode toggle */}
          <button
            onClick={() => setDemoMode(!demoMode)}
            aria-label={demoMode ? 'Exit demo mode' : 'Enter demo mode'}
            className="text-xs border border-slate-600 text-slate-400 hover:text-white px-2.5 py-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Zap size={11} className="inline mr-1" aria-hidden="true" />
            {demoMode ? 'Exit Demo' : 'Demo'}
          </button>
        </div>
      </div>
    </nav>
  );
}
