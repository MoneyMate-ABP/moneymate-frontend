/**
 * Button — reusable button component
 *
 * Props:
 *   variant   — "primary" | "secondary" | "danger" | "ghost" | "google" (default: "primary")
 *   size      — "sm" | "md" | "lg" (default: "md")
 *   loading   — boolean
 *   disabled  — boolean
 *   icon      — React node (left icon)
 *   fullWidth — boolean (default: false)
 *   children  — button label
 *   ...rest   — passed to <button>
 */
function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  fullWidth = false,
  children,
  className = "",
  ...rest
}) {
  const baseClass = "btn";
  const variantClass = `btn-${variant}`;
  const sizeClass = size !== "md" ? `btn-${size}` : "";
  const widthClass = fullWidth ? "" : "btn-auto";

  const classes = [baseClass, variantClass, sizeClass, widthClass, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {loading ? <span className="spinner" /> : icon}
      {children}
    </button>
  );
}

export default Button;
