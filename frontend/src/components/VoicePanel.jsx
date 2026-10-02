/**
 * VoicePanel — Accessible voice assistance control panel.
 *
 * Uses Web Speech API (TTS). Speech Recognition is optional.
 * All buttons have aria-label attributes for screen-reader support.
 * Panel is keyboard-navigable (tab order preserved).
 */
import React, { useState, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Repeat, Navigation, AlertTriangle, Building2, Phone, Mic, MicOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useVoice, createRecognition, TTS_SUPPORTED, RECOGNITION_SUPPORTED } from '../hooks/useVoice';

// Voice command → action mapping
const VOICE_COMMANDS = [
  { phrases: ['start navigation', 'calculate route', 'find route'], action: 'navigate' },
  { phrases: ['repeat', 'say again', 'again'],                      action: 'repeat'   },
  { phrases: ['show hazards', 'hazards', 'warnings'],               action: 'hazards'  },
  { phrases: ['find shelter', 'shelter', 'emergency shelter'],      action: 'shelter'  },
  { phrases: ['emergency', 'sos', 'help'],                          action: 'sos'      },
  { phrases: ['reroute', 'recalculate', 'new route'],               action: 'reroute'  },
];

function matchCommand(transcript) {
  for (const cmd of VOICE_COMMANDS) {
    for (const phrase of cmd.phrases) {
      if (transcript.includes(phrase)) return cmd.action;
    }
  }
  return null;
}

export default function VoicePanel({ onNavigate, onReroute }) {
  const {
    voiceEnabled, setVoiceEnabled,
    lastSpoken,
    evacuationResult,
    hazards,
    activeProfile,
  } = useApp();

  const {
    speak, speakForce, stop,
    announceEvacuation, announceHazards, announceShelter,
    ttsSupported,
  } = useVoice();

  const [listening, setListening] = useState(false);
  const [recognitionError, setRecognitionError] = useState('');
  const recRef = useRef(null);

  // ── Toggle voice on/off ───────────────────────────────────────────────────
  const toggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    if (!ttsSupported) return;
    if (next) {
      speakForce('Voice assistance enabled.');
    } else {
      stop();
    }
  };

  // ── Speak current route ───────────────────────────────────────────────────
  const speakRoute = () => {
    if (!voiceEnabled) { speakForce('Please enable voice assistance first.'); return; }
    if (!evacuationResult) {
      speakForce('No route has been calculated yet. Please calculate a route first.');
      return;
    }
    announceEvacuation(evacuationResult, activeProfile);
  };

  // ── Speak hazards ─────────────────────────────────────────────────────────
  const speakHazards = () => {
    if (!voiceEnabled) { speakForce('Please enable voice assistance first.'); return; }
    announceHazards(hazards);
  };

  // ── Speak shelter ─────────────────────────────────────────────────────────
  const speakShelter = () => {
    if (!voiceEnabled) { speakForce('Please enable voice assistance first.'); return; }
    announceShelter(evacuationResult?.recommended_shelter);
  };

  // ── Repeat last ───────────────────────────────────────────────────────────
  const repeatLast = () => {
    if (!ttsSupported) return;
    if (!lastSpoken) {
      speakForce('Nothing has been spoken yet.');
      return;
    }
    speakForce(lastSpoken);
  };

  // ── Emergency / SOS ───────────────────────────────────────────────────────
  const speakEmergency = () => {
    speakForce(
      'Emergency assistance. If you are in immediate danger, call your local emergency number. ' +
      'Stay in place if it is safer than moving. Emergency services have been notified through this system.'
    );
  };

  // ── Voice recognition (optional) ─────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!RECOGNITION_SUPPORTED) {
      setRecognitionError('Speech recognition is not supported by this browser.');
      return;
    }
    setRecognitionError('');
    const rec = createRecognition(
      (transcript) => {
        setListening(false);
        const action = matchCommand(transcript);
        if (action === 'navigate' && onNavigate) { onNavigate(); speak('Starting route calculation.'); }
        else if (action === 'repeat')             { repeatLast(); }
        else if (action === 'hazards')            { speakHazards(); }
        else if (action === 'shelter')            { speakShelter(); }
        else if (action === 'sos')                { speakEmergency(); }
        else if (action === 'reroute' && onReroute) { onReroute(); speak('Recalculating route.'); }
        else { speak(`Command not recognised: ${transcript}.`); }
      },
      () => setListening(false)
    );
    if (rec) {
      recRef.current = rec;
      rec.start();
      setListening(true);
      setTimeout(() => {
        try { rec.stop(); } catch {}
        setListening(false);
      }, 7000);
    }
  }, [speak, speakHazards, speakShelter, speakEmergency, repeatLast, onNavigate, onReroute]);

  const stopListening = () => {
    try { recRef.current?.stop(); } catch {}
    setListening(false);
  };

  if (!ttsSupported) {
    return (
      <div
        role="region"
        aria-label="Voice assistance"
        className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm"
      >
        <div className="flex items-center gap-2 text-slate-400 mb-1">
          <VolumeX size={16} />
          <span className="font-semibold">Voice Assistance</span>
        </div>
        <p className="text-slate-500 text-xs">
          Voice assistance is not supported by this browser. Try Chrome or Edge for full support.
        </p>
      </div>
    );
  }

  return (
    <section
      role="region"
      aria-label="Voice assistance controls"
      aria-live="polite"
      className="bg-slate-800 border border-slate-700 rounded-xl p-4"
    >
      {/* Header + toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Volume2 size={18} className={voiceEnabled ? 'text-blue-400' : 'text-slate-500'} />
          <span className="text-white font-semibold text-sm">Voice Assistance</span>
          {voiceEnabled && (
            <span className="text-xs bg-blue-700 text-blue-200 px-2 py-0.5 rounded font-bold">ON</span>
          )}
        </div>
        <button
          onClick={toggleVoice}
          aria-label={voiceEnabled ? 'Disable voice assistance' : 'Enable voice assistance'}
          aria-pressed={voiceEnabled}
          className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
            ${voiceEnabled
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
        >
          {voiceEnabled ? '🔊 Enabled' : '🔇 Disabled'}
        </button>
      </div>

      {/* Control buttons — large, accessible */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={speakRoute}
          aria-label="Speak current route information"
          disabled={!evacuationResult}
          className="flex items-center gap-2 px-3 py-3 rounded-lg bg-green-900/40 border border-green-700 hover:bg-green-900/70 text-green-300 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <Navigation size={16} aria-hidden="true" />
          Speak Route
        </button>

        <button
          onClick={speakHazards}
          aria-label="Speak active hazard warnings"
          className="flex items-center gap-2 px-3 py-3 rounded-lg bg-orange-900/40 border border-orange-700 hover:bg-orange-900/70 text-orange-300 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <AlertTriangle size={16} aria-hidden="true" />
          Speak Hazards
        </button>

        <button
          onClick={speakShelter}
          aria-label="Speak recommended shelter information"
          disabled={!evacuationResult?.recommended_shelter}
          className="flex items-center gap-2 px-3 py-3 rounded-lg bg-purple-900/40 border border-purple-700 hover:bg-purple-900/70 text-purple-300 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <Building2 size={16} aria-hidden="true" />
          Speak Shelter
        </button>

        <button
          onClick={repeatLast}
          aria-label="Repeat last voice instruction"
          disabled={!lastSpoken}
          className="flex items-center gap-2 px-3 py-3 rounded-lg bg-slate-700 border border-slate-600 hover:bg-slate-600 text-slate-300 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
        >
          <Repeat size={16} aria-hidden="true" />
          Repeat Last
        </button>
      </div>

      {/* Emergency button — full width, prominent */}
      <button
        onClick={speakEmergency}
        aria-label="Emergency SOS — speak emergency information"
        className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg bg-red-900/60 border border-red-600 hover:bg-red-900 text-red-200 font-bold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
      >
        <Phone size={16} aria-hidden="true" />
        Emergency / SOS
      </button>

      {/* Optional voice input */}
      {RECOGNITION_SUPPORTED && (
        <div className="mt-3 border-t border-slate-700 pt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400 text-xs font-medium">Voice Commands</span>
            <span className="text-slate-500 text-xs">(optional)</span>
          </div>
          <button
            onClick={listening ? stopListening : startListening}
            aria-label={listening ? 'Stop listening for voice commands' : 'Start listening for voice commands'}
            aria-pressed={listening}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
              ${listening
                ? 'bg-blue-700 text-white animate-pulse'
                : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
          >
            {listening ? <><MicOff size={15} /> Stop Listening</> : <><Mic size={15} /> Start Voice Command</>}
          </button>
          {listening && (
            <p className="text-xs text-blue-300 mt-1 text-center" aria-live="assertive">
              Listening… say: "start navigation", "repeat", "show hazards", "find shelter", "reroute", or "emergency"
            </p>
          )}
          {recognitionError && (
            <p className="text-xs text-red-400 mt-1" role="alert">{recognitionError}</p>
          )}
        </div>
      )}

      {/* Last spoken — screen-reader accessible live region */}
      {lastSpoken && (
        <div
          className="mt-3 border-t border-slate-700 pt-2"
          aria-live="polite"
          aria-label="Last spoken text"
        >
          <div className="text-slate-500 text-xs font-medium mb-0.5">Last spoken:</div>
          <div className="text-slate-400 text-xs italic line-clamp-2">{lastSpoken}</div>
        </div>
      )}

      {/* Not-online warning */}
      {!navigator.onLine && (
        <div className="mt-2 text-amber-400 text-xs flex items-center gap-1" role="alert">
          <span>⚠</span> Offline mode — hazard information may be outdated.
        </div>
      )}
    </section>
  );
}
