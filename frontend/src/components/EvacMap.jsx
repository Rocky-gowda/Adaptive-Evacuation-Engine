import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const makeIcon = (color, emoji) => L.divIcon({
  html: `<div style="
    background:${color};border:2px solid white;border-radius:50%;
    width:28px;height:28px;display:flex;align-items:center;
    justify-content:center;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,0.4)
  ">${emoji}</div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const hazardColors = {
  flood:         '#3b82f6',
  blocked_road:  '#f97316',
  damaged_road:  '#ef4444',
  landslide:     '#8b5cf6',
  closed_road:   '#6b7280',
};

const hazardEmoji = {
  flood: '🌊', blocked_road: '🚧', damaged_road: '💥',
  landslide: '⛰', closed_road: '🚫',
};

const hazardCircleColors = {
  flood: '#3b82f6', blocked_road: '#f97316', damaged_road: '#ef4444',
  landslide: '#8b5cf6', closed_road: '#6b7280',
};

function FitBounds({ routes, userLat, userLng }) {
  const map = useMap();
  useEffect(() => {
    const pts = [];
    if (userLat && userLng) pts.push([userLat, userLng]);
    routes.forEach(r => {
      if (r.geojson?.coordinates) {
        r.geojson.coordinates.forEach(c => pts.push([c[1], c[0]]));
      }
    });
    if (pts.length > 1) {
      try { map.fitBounds(pts, { padding: [40, 40] }); } catch (_) {}
    }
  }, [routes, userLat, userLng]);
  return null;
}

export default function EvacMap({
  routes = [],
  hazards = [],
  shelters = [],
  recommendedRouteId = null,
  userLat = 17.4950,
  userLng = 78.3891,
  height = '500px',
}) {
  const center = [userLat, userLng];

  const getRouteColor = (route) => {
    if (route.id === recommendedRouteId) return '#22c55e';
    if (!route.is_accessible || route.has_stairs) return '#ef4444';
    return '#60a5fa';
  };

  const getRouteWeight = (route) => route.id === recommendedRouteId ? 6 : 3;
  const getRouteDash = (route) => route.id === recommendedRouteId ? null : '8 4';

  return (
    <div style={{ height, width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
      <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds routes={routes} userLat={userLat} userLng={userLng} />

        {/* User location */}
        <Marker position={center} icon={makeIcon('#3b82f6', '📍')}>
          <Popup>
            <div className="text-sm font-bold">Your Location</div>
            <div className="text-xs text-gray-500">{userLat.toFixed(4)}, {userLng.toFixed(4)}</div>
          </Popup>
        </Marker>

        {/* Routes */}
        {routes.map(route => {
          if (!route.geojson?.coordinates) return null;
          const positions = route.geojson.coordinates.map(c => [c[1], c[0]]);
          return (
            <React.Fragment key={route.id}>
              <Polyline
                positions={positions}
                color={getRouteColor(route)}
                weight={getRouteWeight(route)}
                dashArray={getRouteDash(route)}
                opacity={0.85}
              >
                <Popup>
                  <div style={{ minWidth: '200px' }}>
                    <div className="font-bold text-sm mb-1">{route.name}</div>
                    {route.id === recommendedRouteId && (
                      <div className="text-green-600 font-semibold text-xs mb-1">✅ RECOMMENDED ROUTE</div>
                    )}
                    <div className="text-xs text-gray-600 space-y-0.5">
                      <div>📏 Distance: {(route.total_distance_m / 1000).toFixed(2)} km</div>
                      <div>⏱ Est. time: {route.estimated_time_min} min</div>
                      <div>🪜 Stairs: {route.has_stairs ? '⚠ Yes' : '✓ None'}</div>
                      <div>♿ Ramp: {route.has_ramp ? '✓ Available' : '✗ None'}</div>
                      <div>📐 Max slope: {route.max_slope_percent}%</div>
                      <div>↔ Min width: {route.min_width_m}m</div>
                      <div>🛣 Surface: {route.surface_condition}</div>
                    </div>
                  </div>
                </Popup>
              </Polyline>
            </React.Fragment>
          );
        })}

        {/* Hazards */}
        {hazards.map(hazard => (
          <React.Fragment key={hazard.id}>
            <Circle
              center={[hazard.latitude, hazard.longitude]}
              radius={hazard.radius_m || 120}
              color={hazardCircleColors[hazard.hazard_type] || '#f97316'}
              fillColor={hazardCircleColors[hazard.hazard_type] || '#f97316'}
              fillOpacity={0.25}
              weight={2}
            />
            <Marker
              position={[hazard.latitude, hazard.longitude]}
              icon={makeIcon(hazardColors[hazard.hazard_type] || '#f97316', hazardEmoji[hazard.hazard_type] || '⚠')}
            >
              <Popup>
                <div style={{ minWidth: '180px' }}>
                  <div className="font-bold text-sm uppercase mb-1">
                    {hazard.hazard_type.replace(/_/g, ' ')}
                  </div>
                  <div className="text-xs space-y-0.5">
                    <div>🔴 Severity: <strong>{hazard.severity?.toUpperCase()}</strong></div>
                    <div>📊 Confidence: {Math.round((hazard.confidence || 0) * 100)}%</div>
                    <div>📡 Status: <strong>{hazard.status?.toUpperCase()}</strong></div>
                    {hazard.description && <div className="text-gray-500 mt-1">{hazard.description}</div>}
                  </div>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        ))}

        {/* Shelters */}
        {shelters.map(shelter => (
          <Marker
            key={shelter.id}
            position={[shelter.latitude, shelter.longitude]}
            icon={makeIcon('#8b5cf6', '🏥')}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <div className="font-bold text-sm mb-1">{shelter.name}</div>
                <div className="text-xs space-y-0.5">
                  <div>👥 Capacity: {shelter.current_occupancy}/{shelter.capacity}</div>
                  <div>♿ Wheelchair: {shelter.wheelchair_accessible ? '✓' : '✗'}</div>
                  <div>🛗 Elevator: {shelter.has_elevator ? '✓' : '✗'}</div>
                  <div>🏥 Medical: {shelter.has_medical_support ? '✓' : '✗'}</div>
                  <div className={`font-semibold ${shelter.status === 'open' ? 'text-green-600' : 'text-red-600'}`}>
                    Status: {shelter.status?.toUpperCase()}
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
