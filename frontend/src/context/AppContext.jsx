import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

// Session-storage key for guest profile
const GUEST_PROFILE_KEY = 'evac_guest_profile';

const DEFAULT_GUEST_PROFILE = {
  name: 'Guest',
  mobility_type: 'general',
  cannot_use_stairs: false,
  requires_ramp: false,
  requires_low_gradient: false,
  requires_wide_pathway: false,
  requires_assistance: false,
  _isGuest: true,
};

function loadGuestProfile() {
  try {
    const stored = sessionStorage.getItem(GUEST_PROFILE_KEY);
    return stored ? JSON.parse(stored) : { ...DEFAULT_GUEST_PROFILE };
  } catch {
    return { ...DEFAULT_GUEST_PROFILE };
  }
}

export function AppProvider({ children }) {
  // Registered user profile (persisted via backend)
  const [userProfile, setUserProfile] = useState(null);

  // Guest session profile (sessionStorage only, never sent to backend as a save)
  const [guestProfile, setGuestProfileState] = useState(() => loadGuestProfile());

  // Which profile is actually "active" for route calculation
  // If userProfile exists (logged in), use that; otherwise use guestProfile
  const activeProfile = userProfile || guestProfile;

  const setGuestProfile = (profile) => {
    const updated = { ...profile, _isGuest: true };
    setGuestProfileState(updated);
    try { sessionStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(updated)); } catch {}
  };

  const [evacuationResult, setEvacuationResult] = useState(null);
  const [hazards, setHazards] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [demoMode, setDemoMode] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  // Voice assistance state
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [lastSpoken, setLastSpoken] = useState('');

  // Online/offline tracking
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  return (
    <AppContext.Provider value={{
      userProfile, setUserProfile,
      guestProfile, setGuestProfile,
      activeProfile,
      evacuationResult, setEvacuationResult,
      hazards, setHazards,
      shelters, setShelters,
      routes, setRoutes,
      demoMode, setDemoMode,
      demoStep, setDemoStep,
      voiceEnabled, setVoiceEnabled,
      lastSpoken, setLastSpoken,
      isOnline,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
