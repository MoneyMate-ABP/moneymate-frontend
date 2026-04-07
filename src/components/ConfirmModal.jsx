import { useState } from "react";

/**
 * A reusable confirmation modal with custom message.
 * Props:
 *  - open: boolean
 *  - title: string
 *  - message: string
 *  - confirmLabel: string (default "Hapus")
 *  - onConfirm: () => void
 *  - onCancel: () => void
 *  - danger: boolean (default true) — red confirm button
 */
function ConfirmModal({
  open,
  title = "Konfirmasi",
  message = "Apakah kamu yakin?",
  confirmLabel = "Hapus",
  onConfirm,
  onCancel,
  danger = true,
}) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        id="confirm-modal"
      >
        <div className="modal-icon">
          {danger ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          )}
        </div>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button className="btn btn-modal-cancel" onClick={onCancel} id="btn-modal-cancel">
            Batal
          </button>
          <button
            className={`btn ${danger ? "btn-modal-danger" : "btn-primary"}`}
            onClick={onConfirm}
            id="btn-modal-confirm"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
