import { useState } from "react";

/* ── Inline SVG icons ──────────────────────────────────── */
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

/**
 * Input — reusable form input component
 *
 * Props:
 *   label     — string label text
 *   error     — string error message
 *   required  — boolean (shows asterisk)
 *   type      — input type (supports "password" with toggle)
 *   optional  — boolean (shows "(opsional)" text)
 *   ...rest   — passed to <input>
 */
function Input({
  label,
  error,
  required = false,
  optional = false,
  type = "text",
  id,
  className = "",
  ...rest
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="form-group">
      {label && (
        <label className="form-label" htmlFor={id}>
          {label}
          {required && <span className="form-required"> *</span>}
          {optional && <span className="form-optional"> (opsional)</span>}
        </label>
      )}
      <div className={isPassword ? "password-wrapper" : undefined}>
        <input
          id={id}
          type={inputType}
          className={`form-input ${error ? "form-input--error" : ""} ${className}`}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}

export default Input;
