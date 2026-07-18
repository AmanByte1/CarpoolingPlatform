import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// custom divIcon markers so we don't need to ship image assets
const makeIcon = (color, glyph) =>
  L.divIcon({
    className: '',
    html: `<div style="background:${color};width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:2px solid white;">
             <span style="transform:rotate(45deg);color:white;font-size:12px;font-weight:700;">${glyph}</span>
           </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
  });

const pickupIcon = makeIcon('#1FAE86', 'A');
const destIcon = makeIcon('#F5A623', 'B');

const carIcon = L.divIcon({
  className: '',
  html: `<div style="position:relative;width:20px;height:20px;">
           <div style="position:absolute;inset:0;border-radius:50%;background:#1FAE86;opacity:0.35;animation:pulseRing 1.8s ease-out infinite;"></div>
           <div style="position:absolute;inset:3px;border-radius:50%;background:#1FAE86;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>
         </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points && points.length > 1) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (points && points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 13);
    }
  }, [JSON.stringify(points)]);
  return null;
}

function makePersonIcon(color, initial) {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:30px;height:30px;">
             <div style="position:absolute;inset:0;border-radius:50%;background:${color};opacity:0.35;animation:pulseRing 1.8s ease-out infinite;"></div>
             <div style="position:absolute;inset:2px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
               <span style="color:white;font-size:11px;font-weight:700;">${initial}</span>
             </div>
           </div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

export default function MapView({ pickup, destination, polyline = [], liveLocation, presenceMarkers = [], height = 320 }) {
  const points = [pickup, destination].filter(Boolean);
  const routeLine = polyline.length ? polyline.map((p) => [p.lat, p.lng]) : points.map((p) => [p.lat, p.lng]);
  const center = pickup ? [pickup.lat, pickup.lng] : [23.03, 72.55];

  return (
    <div style={{ height }} className="rounded-2xl overflow-hidden border border-black/5 relative z-0">
      <MapContainer center={center} zoom={12} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {routeLine.length > 1 && <Polyline positions={routeLine} pathOptions={{ color: '#1FAE86', weight: 4, opacity: 0.85 }} />}
        {pickup && <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} />}
        {destination && <Marker position={[destination.lat, destination.lng]} icon={destIcon} />}
        {liveLocation && <Marker position={[liveLocation.lat, liveLocation.lng]} icon={carIcon} />}
        {presenceMarkers.map((m) => (
          <Marker key={m.userId} position={[m.lat, m.lng]} icon={makePersonIcon(m.color, m.initial)} />
        ))}
        <FitBounds points={points} />
      </MapContainer>
    </div>
  );
}
