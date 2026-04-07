import { useEffect } from "react";

/**
 * ConfirmModal — confirmation dialog with overlay
 * 
 * Props:
 *   isOpen: boolean
 *   title: string
 *   message: string
 *   confirmText: string (default "Hapus")
 *   cancelText: string (default "Batal")
 *   onConfirm: () => void
 *   onCancel: () => void
 *   isLoading: boolean
 *   variant: 'danger' | 'warning' (default danger)
 */
export default function ConfirmModal({
  isOpen,
  title = "Konfirmasi",
  message,
  confirmText = "Hapus",
  cancelText = "Batal",
  onConfirm,
  onCancel,
  isLoading = false,
  variant = "danger",
}) {
  // Close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onCancel]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Icon */}
        <div className={`modal-icon modal-icon--${variant}`}>
          {variant === "danger" ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6" /><path d="M14 11v6" />
              <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          )}
        </div>

        <h3 id="modal-title" className="modal-title">{title}</h3>
        {message && <p className="modal-message">{message}</p>}

        <div className="modal-actions">
          <button
            className="btn-modal-cancel"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            className={`btn-modal-confirm btn-modal-confirm--${variant}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? <span className="spinner" /> : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
