import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, MapPin } from 'lucide-react';
import { api } from '../api';
import { Card, SeverityBadge, ErrorMessage } from '../components/UI';

const HAZARD_TYPES = [
  { value: 'flood',        label: 'Flood',         icon: '🌊' },
  { value: 'blocked_road', label: 'Blocked Road',  icon: '🚧' },
  { value: 'damaged_road', label: 'Damaged Road',  icon: '💥' },
  { value: 'landslide',    label: 'Landslide',     icon: '⛰' },
  { value: 'closed_road',  label: 'Road Closure',  icon: '🚫' },
];

const REPORTER_TYPES = [
  { value: 'citizen',   label: 'Citizen Reporter',    reliability: '55%'  },
  { value: 'responder', label: 'Emergency Responder', reliability: '80%'  },
  { value: 'authority', label: 'Authority / Official', reliability: '95%' },
];

export default function ReportPage() {
  const [form, setForm] = useState({
    hazard_type: '',
    latitude: '17.4963',
    longitude: '78.3920',
    severity: 'medium',
    description: '',
    reporter_type: 'citizen',
  });
  const [submitted, setSubmitted] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [hazardList, setHazardList] = useState([]);
  const [loadingHazards, setLoadingHazards] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.hazard_type) { setError('Select a hazard type.'); return; }
    setError(''); setLoading(true);
    try {
      const result = await api.reportHazard({
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
      });
      setSubmitted(result);
    } catch {
      setError('Failed to submit report. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const loadActiveHazards = async () => {
    setLoadingHazards(true);
    try {
      setHazardList(await api.getHazards());
    } catch {
      setError('Could not load hazards.');
    } finally {
      setLoadingHazards(false);
    }
  };

  const resolveHazard = async (id) => {
    await api.resolveHazard(id);
    setHazardList(h => h.filter(x => x.id !== id));
  };

  const deleteHazard = async (id) => {
    await api.deleteHazard(id);
    setHazardList(h => h.filter(x => x.id !== id));
  };

  React.useEffect(() => { loadActiveHazards(); }, []);

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4">
      <div className="max-w-4xl mx-auto grid lg:grid-cols-2 gap-6">
        {/* Report Form */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={20} className="text-orange-400" />
            <h1 className="text-white font-bold text-xl">Report a Hazard</h1>
          </div>

          {submitted ? (
            <Card className="text-center py-8">
              <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
              <div className="text-green-400 font-bold text-lg mb-1">Report Submitted!</div>
              <div className="text-slate-400 text-sm mb-4">
                Confidence Score: <strong className="text-white">{Math.round((submitted.confidence_score || 0.5) * 100)}%</strong>
              </div>
              <button
                onClick={() => { setSubmitted(null); loadActiveHazards(); }}
                className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg"
              >
                Submit Another Report
              </button>
            </Card>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Hazard type */}
              <Card>
                <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider block mb-2">
                  Hazard Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {HAZARD_TYPES.map(h => (
                    <button
                      type="button"
                      key={h.value}
                      onClick={() => set('hazard_type', h.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors
                        ${form.hazard_type === h.value
                          ? 'border-orange-500 bg-orange-900/30 text-white'
                          : 'border-slate-600 text-slate-400 hover:border-slate-500'}`}
                    >
                      <span>{h.icon}</span> {h.label}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Location */}
              <Card>
                <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider block mb-2">
                  <MapPin size={12} className="inline mr-1" />Location
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Latitude</label>
                    <input
                      value={form.latitude}
                      onChange={e => set('latitude', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                      placeholder="17.4963"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1">Longitude</label>
                    <input
                      value={form.longitude}
                      onChange={e => set('longitude', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                      placeholder="78.3920"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Demo area centre: 17.4950, 78.3891 (JNTU Hyderabad campus)
                </p>
              </Card>

              {/* Severity */}
              <Card>
                <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider block mb-2">Severity</label>
                <div className="grid grid-cols-4 gap-2">
                  {['low', 'medium', 'high', 'critical'].map(s => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => set('severity', s)}
                      className={`py-1.5 rounded text-xs font-bold uppercase transition-colors border
                        ${form.severity === s
                          ? s === 'low' ? 'bg-green-800 border-green-600 text-green-200'
                          : s === 'medium' ? 'bg-amber-800 border-amber-600 text-amber-200'
                          : s === 'high' ? 'bg-red-800 border-red-600 text-red-200'
                          : 'bg-red-950 border-red-500 text-red-200'
                          : 'border-slate-600 text-slate-400'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </Card>

              {/* Description */}
              <Card>
                <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider block mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  rows={3}
                  placeholder="Describe the hazard location, severity, affected area…"
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
              </Card>

              {/* Reporter type */}
              <Card>
                <label className="text-slate-300 text-xs font-semibold uppercase tracking-wider block mb-2">Reporter Type</label>
                <div className="space-y-2">
                  {REPORTER_TYPES.map(r => (
                    <label
                      key={r.value}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer border transition-colors
                        ${form.reporter_type === r.value ? 'border-blue-600 bg-blue-900/20' : 'border-transparent hover:bg-slate-700/40'}`}
                    >
                      <input
                        type="radio"
                        name="reporter_type"
                        value={r.value}
                        checked={form.reporter_type === r.value}
                        onChange={() => set('reporter_type', r.value)}
                        className="accent-blue-500"
                      />
                      <div>
                        <div className="text-white text-sm font-medium">{r.label}</div>
                        <div className="text-slate-400 text-xs">Reliability weight: {r.reliability}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </Card>

              {error && <ErrorMessage message={error} />}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <AlertTriangle size={16} />
                {loading ? 'Submitting…' : 'Submit Hazard Report'}
              </button>
            </form>
          )}
        </div>

        {/* Active hazards list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg">Active Hazards</h2>
            <button
              onClick={loadActiveHazards}
              className="text-xs text-slate-400 hover:text-white border border-slate-600 px-2.5 py-1 rounded"
            >
              Refresh
            </button>
          </div>

          {loadingHazards ? (
            <div className="text-slate-400 text-sm">Loading…</div>
          ) : hazardList.length === 0 ? (
            <Card><div className="text-slate-400 text-sm text-center py-4">No active hazards</div></Card>
          ) : (
            <div className="space-y-2">
              {hazardList.map(h => (
                <Card key={h.id} className="border-orange-900">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white text-sm">
                          {HAZARD_TYPES.find(t => t.value === h.hazard_type)?.icon || '⚠'}{' '}
                          {h.hazard_type.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <SeverityBadge severity={h.severity} />
                      </div>
                      <div className="text-xs text-slate-400">
                        Confidence: {Math.round(h.confidence * 100)}% · Status: {h.status}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        📍 {h.latitude?.toFixed(4)}, {h.longitude?.toFixed(4)}
                      </div>
                      {h.description && <div className="text-xs text-slate-400 mt-1">{h.description}</div>}
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => resolveHazard(h.id)}
                        className="text-xs bg-green-800 hover:bg-green-700 text-green-200 px-2 py-1 rounded"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => deleteHazard(h.id)}
                        className="text-xs bg-red-900 hover:bg-red-800 text-red-200 px-2 py-1 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
