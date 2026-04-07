import { useState, useEffect, useRef } from "react";

/**
 * CurrencyInput — formats value as Indonesian Rupiah (Rp 1.000.000)
 * 
 * Props:
 *   value: number (raw)
 *   onChange: (number) => void
 *   placeholder: string
 *   error: string
 *   id: string
 */
function formatRupiah(num) {
  if (!num && num !== 0) return "";
  return new Intl.NumberFormat("id-ID").format(num);
}

function parseRupiah(str) {
  // Remove all non-digit chars
  const raw = str.replace(/\D/g, "");
  return raw === "" ? "" : parseInt(raw, 10);
}

export default function CurrencyInput({
  value,
  onChange,
  placeholder = "0",
  error,
  id,
  disabled,
}) {
  const [displayValue, setDisplayValue] = useState(
    value != null && value !== "" ? formatRupiah(value) : ""
  );
  const isComposing = useRef(false);

  // Sync external value changes
  useEffect(() => {
    if (value != null && value !== "") {
      setDisplayValue(formatRupiah(value));
    } else {
      setDisplayValue("");
    }
  }, [value]);

  function handleChange(e) {
    const raw = e.target.value;
    const parsed = parseRupiah(raw);

    if (parsed === "") {
      setDisplayValue("");
      onChange("");
    } else {
      setDisplayValue(formatRupiah(parsed));
      onChange(parsed);
    }
  }

  return (
    <div className="currency-input-wrapper">
      <span className="currency-input-prefix">Rp</span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        className={`form-input currency-input${error ? " input-error" : ""}`}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />
    </div>
  );
}
