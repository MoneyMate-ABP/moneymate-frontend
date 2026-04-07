import { useState } from "react";

/**
 * LocationPicker — geolocation picker button
 * 
 * Props:
 *   value: { lat, lng } | null
 *   onChange: ({ lat, lng } | null) => void
 */
export default function LocationPicker({ value, onChange }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function handlePickLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation tidak didukung browser ini.");
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        onChange({ lat: parseFloat(lat.toFixed(7)), lng: parseFloat(lng.toFixed(7)) });
        setLoading(false);
      },
      (err) => {
        setError("Gagal mengambil lokasi: " + err.message);
        setLoading(false);
      },
      { timeout: 10000, maximumAge: 30000 }
    );
  }

  function handleClear() {
    onChange(null);
    setError(null);
  }

  const mapsUrl = value
    ? `https://www.google.com/maps?q=${value.lat},${value.lng}`
    : null;

  return (
    <div className="location-picker">
      {!value ? (
        <button
          type="button"
          className="btn-location"
          onClick={handlePickLocation}
          disabled={loading}
          id="btn-get-location"
        >
          {loading ? (
            <>
              <span className="spinner spinner--sm" />
              Mengambil lokasi...
            </>
          ) : (
            <>
              <svg className="location-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Gunakan Lokasi Saya
            </>
          )}
        </button>
      ) : (
        <div className="location-preview">
          <div className="location-preview__coords">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1118 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>
              {value.lat}, {value.lng}
            </span>
          </div>
          <div className="location-preview__actions">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-maps-link"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Lihat di Maps
            </a>
            <button type="button" className="btn-location-clear" onClick={handleClear}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Hapus Lokasi
            </button>
          </div>
        </div>
      )}
      {error && (
        <p className="location-error">{error}</p>
      )}
    </div>
  );
}
