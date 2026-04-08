import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { logoutUser } from "../../services/authService";
import ConfirmModal from "../ConfirmModal";
import toast from "react-hot-toast";

/* ── SVG Icons ─────────────────────────────────────────── */
const WalletIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

function Navbar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutUser();
    } catch {
      // Even if backend logout fails, clear local state
    }
    logout();
    toast.success("Berhasil logout!");
    navigate("/login", { replace: true });
  };

  return (
    <>
      <header className="app-navbar" id="app-navbar">
        <div className="app-navbar__left">
          <div className="app-navbar__logo">
            <WalletIcon />
          </div>
          <div className="app-navbar__brand">
            <h2>MoneyMate</h2>
            <span className="app-navbar__date">{today}</span>
          </div>
        </div>

        <div className="app-navbar__right">
          {/* Notification bell (visual only for now) */}
          <button
            className="app-navbar__bell"
            title="Notifikasi"
            aria-label="Notifikasi"
            onClick={() => toast("Fitur notifikasi segera hadir!", { icon: "🔔" })}
          >
            <BellIcon />
          </button>

          <div className="app-navbar__user">
            <div className="app-navbar__avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <span className="app-navbar__name">{user?.name}</span>
          </div>

          <button
            className="btn-logout"
            onClick={() => setShowLogoutConfirm(true)}
            id="logout-btn"
          >
            <LogoutIcon />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Logout"
        message="Yakin ingin keluar dari MoneyMate?"
        warning="Kamu perlu login kembali untuk mengakses akunmu."
        confirmText="Ya, Logout"
        cancelText="Batal"
        icon="👋"
        isSubmitting={loggingOut}
        variant="danger"
      />
    </>
  );
}

export default Navbar;
