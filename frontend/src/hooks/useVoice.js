/**
 * useVoice — Web Speech API wrapper
 *
 * Text-to-Speech (TTS) is the primary feature using SpeechSynthesis (widely supported).
 * Speech Recognition is OPTIONAL and gracefully absent when unsupported.
 *
 * Safety language: all speech phrases use hedged language ("based on available information")
 * and never claim routes are "guaranteed safe".
 */
import { useCallback, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';

// ── TTS support detection ────────────────────────────────────────────────────
export const TTS_SUPPORTED = typeof window !== 'undefined' && 'speechSynthesis' in window;
export const RECOGNITION_SUPPORTED =
  typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

// ── Helpers ──────────────────────────────────────────────────────────────────
function buildSpeechQueue() {
  // Returns utterances sequentially so they don't overlap
  const queue = [];
  let speaking = false;
  function next() {
    if (!speaking && queue.length > 0) {
      speaking = true;
      const utt = queue.shift();
      window.speechSynthesis.speak(utt);
      utt.onend = () => { speaking = false; next(); };
      utt.onerror = () => { speaking = false; next(); };
    }
  }
  return {
    add(text, rate = 0.95, pitch = 1) {
      if (!TTS_SUPPORTED || !text) return;
      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = rate;
      utt.pitch = pitch;
      utt.lang = 'en-IN';
      queue.push(utt);
      next();
    },
    cancel() {
      queue.length = 0;
      if (TTS_SUPPORTED) window.speechSynthesis.cancel();
      speaking = false;
    },
  };
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useVoice() {
  const { voiceEnabled, setLastSpoken } = useApp();
  const speechQ = useRef(buildSpeechQueue());

  // Re-create queue on mount only
  useEffect(() => {
    speechQ.current = buildSpeechQueue();
    return () => { speechQ.current.cancel(); };
  }, []);

  const speak = useCallback((text, opts = {}) => {
    if (!voiceEnabled || !TTS_SUPPORTED || !text) return;
    const { rate = 0.95, pitch = 1, force = false } = opts;
    if (!force && !voiceEnabled) return;
    speechQ.current.add(text, rate, pitch);
    setLastSpoken(text);
  }, [voiceEnabled, setLastSpoken]);

  const speakForce = useCallback((text) => {
    if (!TTS_SUPPORTED || !text) return;
    speechQ.current.cancel();
    speechQ.current.add(text, 0.95, 1);
    setLastSpoken(text);
  }, [setLastSpoken]);

  const stop = useCallback(() => {
    speechQ.current.cancel();
  }, []);

  // ── Composed evacuation announcement ─────────────────────────────────────
  const announceEvacuation = useCallback((evacuationResult, activeProfile) => {
    if (!voiceEnabled || !TTS_SUPPORTED) return;
    speechQ.current.cancel();

    const rec = evacuationResult?.recommended_route;
    const shelter = evacuationResult?.recommended_shelter;
    const mobilityLabel = (activeProfile?.mobility_type || 'general').replace(/_/g, ' ');

    const sentences = [];

    // 1. Profile
    sentences.push(`${mobilityLabel} profile is active.`);

    // 2. Route result
    if (rec) {
      const distKm = (rec.distance_m / 1000).toFixed(1);
      const score  = rec.feasibility_score;
      sentences.push(
        `Based on available hazard and accessibility information, a feasible evacuation route has been identified.`
      );
      sentences.push(
        `The recommended route is approximately ${distKm} kilometres.`
      );
      sentences.push(
        `Route feasibility score is ${score} out of 100.`
      );

      // 3. Route explanation (first 2 accepted reasons)
      const accepted = rec.reasons_accepted?.slice(0, 2) || [];
      if (accepted.length > 0) {
        sentences.push(
          `This route was selected because: ${accepted.join('. ')}.`
        );
      }

      // 4. Hazard warnings on route
      const routeHazards = rec.hazard_details || [];
      if (routeHazards.length > 0) {
        routeHazards.forEach(h => {
          sentences.push(
            `Warning. ${h.type.replace(/_/g, ' ')} has been reported on this route with ${h.severity} severity.`
          );
        });
      }

      // 5. Rejected reasons from other routes (brief)
      const rejectedRoute = evacuationResult.all_routes?.find(
        r => r.route_id !== rec.route_id && r.reasons_rejected?.length > 0
      );
      if (rejectedRoute) {
        sentences.push(
          `An alternative shorter route was not recommended because: ${rejectedRoute.reasons_rejected[0]}.`
        );
      }
    } else {
      sentences.push(
        `No fully accessible route was found using the currently available information. Please request assisted evacuation.`
      );
    }

    // 6. Shelter
    if (shelter) {
      const accessible = shelter.wheelchair_accessible
        ? 'The shelter has wheelchair accessible facilities.'
        : 'This shelter may not be fully suitable for the selected mobility profile.';
      sentences.push(
        `The recommended emergency shelter is ${shelter.name}. ${accessible}`
      );
    }

    // 7. Offline caveat
    if (!navigator.onLine) {
      sentences.push(
        `Note: You are currently offline. Hazard information may be outdated.`
      );
    }

    sentences.forEach((s, i) => {
      setTimeout(() => {
        if (TTS_SUPPORTED && voiceEnabled) speechQ.current.add(s);
      }, i * 200);
    });

    setLastSpoken(sentences.join(' '));
  }, [voiceEnabled, setLastSpoken]);

  // ── Reroute announcement ──────────────────────────────────────────────────
  const announceReroute = useCallback((newResult) => {
    if (!TTS_SUPPORTED) return;
    speechQ.current.cancel();
    const rec = newResult?.recommended_route;
    speechQ.current.add(
      `Warning. A hazard has affected your current route. Recalculating a feasible alternative.`
    );
    if (rec) {
      speechQ.current.add(
        `A new route has been selected. ${newResult.reroute_reason || ''}`
      );
      speechQ.current.add(
        `New feasibility score is ${rec.feasibility_score} out of 100.`
      );
    } else {
      speechQ.current.add(
        `No alternative accessible route was found. Please seek assisted evacuation.`
      );
    }
    setLastSpoken('Rerouting announced.');
  }, [setLastSpoken]);

  // ── Hazard announcement ───────────────────────────────────────────────────
  const announceHazards = useCallback((hazards) => {
    if (!voiceEnabled || !TTS_SUPPORTED) return;
    speechQ.current.cancel();
    const active = (hazards || []).filter(h => h.status === 'active');
    if (active.length === 0) {
      speechQ.current.add('No active hazards are currently reported in the area.');
    } else {
      speechQ.current.add(`${active.length} active hazard${active.length > 1 ? 's' : ''} reported.`);
      active.slice(0, 3).forEach(h => {
        const conf = Math.round((h.confidence || 0.5) * 100);
        speechQ.current.add(
          `${h.hazard_type.replace(/_/g, ' ')}. Severity: ${h.severity}. Confidence: ${conf} percent.`
        );
      });
    }
    if (!navigator.onLine) {
      speechQ.current.add('Offline mode. Hazard data may be outdated.');
    }
    setLastSpoken('Hazards announced.');
  }, [voiceEnabled, setLastSpoken]);

  // ── Shelter announcement ──────────────────────────────────────────────────
  const announceShelter = useCallback((shelter) => {
    if (!voiceEnabled || !TTS_SUPPORTED) return;
    if (!shelter) {
      speechQ.current.add('No accessible shelter was found for the selected mobility profile.');
      return;
    }
    const lines = [
      `Recommended shelter: ${shelter.name}.`,
      `Accessibility score: ${shelter.accessibility_score} out of 100.`,
      shelter.wheelchair_accessible ? 'Wheelchair accessible.' : 'Not fully wheelchair accessible.',
      shelter.has_ramp ? 'Ramp available.' : '',
      shelter.has_medical_support ? 'Medical support available.' : '',
      `Current availability: ${shelter.availability_pct} percent.`,
    ].filter(Boolean);
    lines.forEach(l => speechQ.current.add(l));
    setLastSpoken('Shelter announced.');
  }, [voiceEnabled, setLastSpoken]);

  return {
    speak,
    speakForce,
    stop,
    announceEvacuation,
    announceReroute,
    announceHazards,
    announceShelter,
    ttsSupported: TTS_SUPPORTED,
    recognitionSupported: RECOGNITION_SUPPORTED,
  };
}

// ── Voice Recognition (optional) ─────────────────────────────────────────────
/**
 * Returns a recognition instance or null.
 * Caller must handle null gracefully.
 */
export function createRecognition(onResult, onEnd) {
  if (!RECOGNITION_SUPPORTED) return null;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new SR();
  rec.continuous = false;
  rec.interimResults = false;
  rec.lang = 'en-IN';
  rec.onresult = (e) => {
    const transcript = e.results[0]?.[0]?.transcript?.toLowerCase().trim() || '';
    onResult(transcript);
  };
  rec.onend = () => { if (onEnd) onEnd(); };
  rec.onerror = () => { if (onEnd) onEnd(); };
  return rec;
}
