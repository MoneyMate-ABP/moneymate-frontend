/**
 * Spinner — reusable loading spinner
 *
 * Props:
 *   size      — "sm" | "md" | "lg" (default: "md")
 *   fullscreen — boolean (center in viewport)
 *   message   — string (shown below spinner when fullscreen)
 */
function Spinner({ size = "md", fullscreen = false, message }) {
  const sizeClass = size === "sm" ? "spinner--sm" : size === "lg" ? "spinner-lg" : "";
  const spinnerClasses = ["spinner", sizeClass].filter(Boolean).join(" ");

  if (fullscreen) {
    return (
      <div className="spinner-fullscreen">
        <div className={spinnerClasses} />
        {message && <p className="spinner-fullscreen__msg">{message}</p>}
      </div>
    );
  }

  return <span className={spinnerClasses} />;
}

export default Spinner;
