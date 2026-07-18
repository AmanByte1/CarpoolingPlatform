import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, X } from 'lucide-react';

// Free-text location search backed by OpenStreetMap Nominatim (no API key required).
export default function PlaceInput({ label, value, onChange, savedPlaces = [] }) {
  const [query, setQuery] = useState(value?.address || '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const timer = useRef(null);

  useEffect(() => setQuery(value?.address || ''), [value?.address]);

  const search = (q) => {
    setQuery(q);
    onChange?.(null);
    if (timer.current) clearTimeout(timer.current);
    if (q.trim().length < 3) {
      setResults([]);
      return;
    }
    timer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=in&q=${encodeURIComponent(q)}`,
          { headers: { Accept: 'application/json' } }
        );
        const data = await res.json();
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 450);
  };

  const pick = (place) => {
    const selected = {
      address: place.address || place.display_name,
      lat: Number(place.lat),
      lng: Number(place.lng ?? place.lon),
    };
    onChange(selected);
    setQuery(selected.address);
    setResults([]);
    setOpen(false);
  };

  return (
    <div className="relative">
      <label className="text-xs font-medium text-muted">{label}</label>
      <div className="mt-1.5 relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => search(e.target.value)}
          placeholder="Search an address…"
          className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-black/10 bg-card text-sm"
        />
        {query && (
          <button type="button" onClick={() => { setQuery(''); onChange(null); setResults([]); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
            <X size={14} />
          </button>
        )}
      </div>

      {open && (query.length < 3 ? savedPlaces.length > 0 : results.length > 0 || searching) && (
        <div className="absolute z-20 mt-1.5 w-full bg-card border border-black/10 rounded-xl shadow-soft overflow-hidden">
          {query.length < 3 &&
            savedPlaces.map((p) => (
              <button
                type="button" key={p._id || p.label}
                onClick={() => pick(p)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-route-light flex items-center gap-2.5"
              >
                <MapPin size={14} className="text-route shrink-0" />
                <span><strong>{p.label}</strong> · <span className="text-muted">{p.address}</span></span>
              </button>
            ))}
          {searching && <p className="px-4 py-3 text-xs text-muted">Searching…</p>}
          {results.map((r) => (
            <button
              type="button" key={r.place_id}
              onClick={() => pick({ address: r.display_name, lat: r.lat, lon: r.lon })}
              className="w-full text-left px-4 py-2.5 text-sm hover:bg-route-light flex items-start gap-2.5"
            >
              <MapPin size={14} className="text-muted shrink-0 mt-0.5" />
              <span className="line-clamp-2">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
