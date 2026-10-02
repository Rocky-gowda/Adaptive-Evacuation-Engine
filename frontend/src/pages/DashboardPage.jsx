import React, { useEffect, useState } from 'react';
import { LayoutDashboard, RefreshCw, AlertTriangle, Shield, Building2, Users, Activity } from 'lucide-react';
import { api } from '../api';
import { StatCard, FeasibilityBar, SeverityBadge, Card, LoadingSpinner, ErrorMessage } from '../components/UI';
import EvacMap from '../components/EvacMap';
import { useApp } from '../context/AppContext';

export default function DashboardPage() {
  const { hazards, setHazards, shelters, setShelters, routes, setRoutes } = useApp();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true); setError('');
    try {
      const [s, h, sh, r] = await Promise.all([
        api.getDashboardStats(),
        api.getHazards(),
        api.getShelters(),
        api.getRoutes(),
      ]);
      setStats(s);
      setHazards(h);
      setShelters(sh);
      setRoutes(r);
    } catch {
      setError('Failed to load dashboard data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4">
      <div className="max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Shield size={28} className="text-red-500" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full emergency-pulse" />
            </div>
            <div>
              <h1 className="text-white font-extrabold text-2xl tracking-tight">
                EVACUATION FEASIBILITY
              </h1>
              <div className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
                Authority Operations Dashboard
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-red-900 border border-red-700 text-red-300 px-2 py-1 rounded font-bold emergency-pulse">
              ● LIVE
            </span>
            <button
              onClick={loadAll}
              className="text-xs border border-slate-600 text-slate-400 hover:text-white px-3 py-1.5 rounded flex items-center gap-1"
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
        </div>

        {error && <div className="mb-4"><ErrorMessage message={error} /></div>}
        {loading && <LoadingSpinner text="Loading dashboard…" />}

        {stats && !loading && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <StatCard
                title="Active Hazards"
                value={stats.active_hazards}
                subtitle="Floods, blockages, damage"
                icon={AlertTriangle}
                color="red"
                pulse={stats.active_hazards > 0}
              />
              <StatCard
                title="Affected Routes"
                value={stats.affected_routes}
                subtitle={`of ${routes.length} total routes`}
                icon={Activity}
                color="amber"
              />
              <StatCard
                title="Available Shelters"
                value={stats.available_shelters}
                subtitle={`of ${stats.total_shelters} total`}
                icon={Building2}
                color="green"
              />
              <StatCard
                title="Require Assistance"
                value={stats.people_requiring_assistance}
                subtitle="Users needing help"
                icon={Users}
                color="purple"
              />
            </div>

            {/* Capacity */}
            <Card className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-300 text-sm font-semibold">Shelter System Capacity</span>
                <span className={`text-sm font-bold ${stats.shelter_capacity_used_pct > 80 ? 'text-red-400' : stats.shelter_capacity_used_pct > 60 ? 'text-amber-400' : 'text-green-400'}`}>
                  {stats.shelter_capacity_used_pct}% Used
                </span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${stats.shelter_capacity_used_pct > 80 ? 'bg-red-500' : stats.shelter_capacity_used_pct > 60 ? 'bg-amber-500' : 'bg-green-500'}`}
                  style={{ width: `${stats.shelter_capacity_used_pct}%` }}
                />
              </div>
            </Card>

            <div className="grid lg:grid-cols-3 gap-6 mb-6">
              {/* Route feasibility */}
              <div className="lg:col-span-1">
                <Card>
                  <div className="text-slate-300 font-semibold text-sm mb-3 flex items-center gap-2">
                    <Activity size={16} className="text-blue-400" />
                    Route Feasibility (General)
                  </div>
                  <div className="space-y-3">
                    {(stats.route_feasibility_summary || []).map(r => (
                      <div key={r.id}>
                        <div className="text-xs text-slate-400 mb-1 truncate">{r.name}</div>
                        <FeasibilityBar score={r.feasibility} />
                        <div className="flex gap-2 mt-1">
                          {r.has_stairs && <span className="text-xs text-red-400">🪜 Stairs</span>}
                          {!r.is_accessible && <span className="text-xs text-red-400">⚠ Not accessible</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Recent hazards */}
                <Card className="mt-4">
                  <div className="text-slate-300 font-semibold text-sm mb-3 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-orange-400" />
                    Recent Hazards
                  </div>
                  {(stats.recent_hazards || []).length === 0 ? (
                    <p className="text-slate-500 text-xs">No recent hazards</p>
                  ) : (
                    <div className="space-y-2">
                      {stats.recent_hazards.map(h => (
                        <div key={h.id} className="flex items-center justify-between text-xs border-b border-slate-700 pb-1">
                          <span className="text-white capitalize">{h.type?.replace(/_/g, ' ')}</span>
                          <div className="flex items-center gap-1">
                            <SeverityBadge severity={h.severity} />
                            <span className="text-slate-500">{Math.round(h.confidence * 100)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Shelter list */}
                <Card className="mt-4">
                  <div className="text-slate-300 font-semibold text-sm mb-3 flex items-center gap-2">
                    <Building2 size={16} className="text-purple-400" />
                    Shelter Status
                  </div>
                  <div className="space-y-2">
                    {shelters.map(s => {
                      const pct = Math.round((s.current_occupancy / Math.max(s.capacity, 1)) * 100);
                      return (
                        <div key={s.id} className="text-xs">
                          <div className="flex justify-between mb-0.5">
                            <span className="text-slate-300 truncate pr-2">{s.name}</span>
                            <span className={pct > 90 ? 'text-red-400' : pct > 70 ? 'text-amber-400' : 'text-green-400'}>
                              {pct}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-amber-500' : 'bg-green-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              {/* Map */}
              <div className="lg:col-span-2">
                <Card className="p-0 overflow-hidden">
                  <div className="p-3 border-b border-slate-700 flex items-center gap-2">
                    <span className="text-slate-300 font-semibold text-sm">Live Operations Map</span>
                    <span className="text-xs text-slate-500">— All routes, hazards & shelters</span>
                  </div>
                  <EvacMap
                    routes={routes}
                    hazards={hazards}
                    shelters={shelters}
                    height="480px"
                  />
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
