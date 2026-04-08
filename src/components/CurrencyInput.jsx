import { useState, useCallback } from "react";

/**
 * CurrencyInput — format Rp otomatis
 *
 * Props:
 *   value        — numeric value (number)
 *   onChange     — (numericValue: number) => void
 *   id           — HTML id
 *   placeholder  — input placeholder
 *   error        — boolean, show error border
 *   disabled     — boolean
 */
function formatToRupiah(num) {
  if (!num && num !== 0) return "";
  return new Intl.NumberFormat("id-ID").format(num);
}

function parseFromRupiah(str) {
  // Remove all non-digit characters
  const digits = str.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

function CurrencyInput({
  value,
  onChange,
  id,
  placeholder = "0",
  error,
  disabled,
}) {
  const [display, setDisplay] = useState(value ? formatToRupiah(value) : "");

  // Sync display when value changes externally
  const handleFocus = useCallback(() => {
    if (value) {
      setDisplay(formatToRupiah(value));
    }
  }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value;
    const numeric = parseFromRupiah(raw);

    // Limit to reasonable amount (999 billion)
    if (numeric > 999_999_999_999) return;

    setDisplay(numeric ? formatToRupiah(numeric) : "");
    onChange(numeric);
  };

  const handleBlur = () => {
    if (value) {
      setDisplay(formatToRupiah(value));
    } else {
      setDisplay("");
    }
  };

  return (
    <div className={`currency-input ${error ? "currency-input--error" : ""}`}>
      <span className="currency-input__prefix">Rp.</span>
      <input
        id={id}
        className="currency-input__field"
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={display}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        autoComplete="off"
      />
    </div>
  );
}

export default CurrencyInput;
