/**
 * ConfirmModal — reusable confirmation dialog
 *
 * Props:
 *   isOpen      — boolean
 *   onClose     — () => void
 *   onConfirm   — () => void
 *   title       — modal title string
 *   message     — main message (string or JSX)
 *   warning     — small warning text below message
 *   confirmText — confirm button label (default: "Hapus")
 *   cancelText  — cancel button label (default: "Batal")
 *   icon        — emoji or icon (default: "🗑️")
 *   isSubmitting — boolean, loading state
 *   variant     — "danger" | "warning" (default: "danger")
 */

const CloseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Konfirmasi",
  message = "Apakah Anda yakin?",
  warning,
  confirmText = "Hapus",
  cancelText = "Batal",
  icon = "🗑️",
  isSubmitting = false,
  variant = "danger",
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content modal-content--sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="delete-modal__body">
          <div className="delete-modal__icon">{icon}</div>
          <p>{message}</p>
          {warning && <span className="delete-modal__warning">{warning}</span>}
        </div>

        <div className="delete-modal__actions">
          <button className="btn btn-ghost" onClick={onClose} type="button">
            {cancelText}
          </button>
          <button
            className={`btn ${variant === "danger" ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={isSubmitting}
            id="confirm-action-btn"
            type="button"
          >
            {isSubmitting && <span className="spinner" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
