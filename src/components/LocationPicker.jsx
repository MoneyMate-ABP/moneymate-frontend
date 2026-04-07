import { useState, useCallback, useEffect } from "react";

/* ── SVG Icons ─────────────────────────────────────────── */
const MapPinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const CrosshairIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="22" y1="12" x2="18" y2="12" />
    <line x1="6" y1="12" x2="2" y2="12" />
    <line x1="12" y1="6" x2="12" y2="2" />
    <line x1="12" y1="22" x2="12" y2="18" />
  </svg>
);

const TrashSmIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const ExternalLinkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

/**
 * LocationPicker — pick current location using navigator.geolocation
 *
 * Props:
 *   latitude      — string value of latitude
 *   longitude     — string value of longitude
 *   onLatChange   — (value: string) => void
 *   onLngChange   — (value: string) => void
 *   disabled      — boolean
 */
function LocationPicker({ latitude, longitude, onLatChange, onLngChange, disabled }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [supported] = useState(() => !!navigator.geolocation);

  const hasLocation = latitude && longitude;

  const handleGetLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation tidak didukung oleh browser ini.");
      return;
    }

    setLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLatChange(pos.coords.latitude.toString());
        onLngChange(pos.coords.longitude.toString());
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Izin lokasi ditolak. Aktifkan di pengaturan browser.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Informasi lokasi tidak tersedia.");
            break;
          case err.TIMEOUT:
            setError("Permintaan lokasi timeout. Coba lagi.");
            break;
          default:
            setError("Gagal mendapatkan lokasi.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [onLatChange, onLngChange]);

  const handleClear = useCallback(() => {
    onLatChange("");
    onLngChange("");
    setError("");
  }, [onLatChange, onLngChange]);

  const mapsUrl = hasLocation
    ? `https://www.google.com/maps?q=${latitude},${longitude}`
    : null;

  // Clear error after 5s
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 5000);
    return () => clearTimeout(t);
  }, [error]);

  return (
    <div className="location-picker" id="location-picker">
      {/* Action bar */}
      <div className="location-picker__actions">
        <button
          type="button"
          className={`location-picker__btn location-picker__btn--detect ${loading ? "loading" : ""}`}
          onClick={handleGetLocation}
          disabled={disabled || loading || !supported}
          id="detect-location-btn"
        >
          {loading ? (
            <span className="spinner spinner--sm" />
          ) : (
            <CrosshairIcon />
          )}
          <span>{loading ? "Mendeteksi..." : "Deteksi Lokasi Saya"}</span>
        </button>

        {hasLocation && (
          <button
            type="button"
            className="location-picker__btn location-picker__btn--clear"
            onClick={handleClear}
            disabled={disabled}
            id="clear-location-btn"
          >
            <TrashSmIcon />
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="location-picker__error" id="location-error">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Coordinate fields */}
      <div className="location-picker__fields">
        <div className="location-picker__field">
          <label className="location-picker__label" htmlFor="lp-latitude">Lat</label>
          <input
            id="lp-latitude"
            className="form-input form-input--sm"
            type="text"
            placeholder="Latitude"
            value={latitude || ""}
            onChange={(e) => onLatChange(e.target.value)}
            disabled={disabled}
          />
        </div>
        <div className="location-picker__field">
          <label className="location-picker__label" htmlFor="lp-longitude">Lng</label>
          <input
            id="lp-longitude"
            className="form-input form-input--sm"
            type="text"
            placeholder="Longitude"
            value={longitude || ""}
            onChange={(e) => onLngChange(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Preview link */}
      {hasLocation && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="location-picker__preview"
          id="location-preview-link"
        >
          <MapPinIcon />
          <span className="location-picker__coords">
            {Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}
          </span>
          <ExternalLinkIcon />
        </a>
      )}
    </div>
  );
}

export default LocationPicker;
