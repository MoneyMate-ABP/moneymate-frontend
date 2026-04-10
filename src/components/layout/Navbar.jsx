import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { logoutUser } from "../../services/authService";
import {
  isPushSupported,
  getPermissionStatus,
  requestNotificationPermission,
  subscribePushNotification,
} from "../../services/notificationService";
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

const ChevronDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

function Navbar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifPermission, setNotifPermission] = useState("default");
  const dropdownRef = useRef(null);

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Check notification permission on mount
  useEffect(() => {
    if (isPushSupported()) {
      setNotifPermission(getPermissionStatus());
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  // Close dropdown on Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setDropdownOpen(false);
    };
    if (dropdownOpen) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => document.removeEventListener("keydown", handleEsc);
  }, [dropdownOpen]);

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

  const handleBellClick = async () => {
    if (!isPushSupported()) {
      toast.error("Browser ini tidak mendukung notifikasi push.");
      return;
    }

    const currentPerm = getPermissionStatus();

    if (currentPerm === "denied") {
      toast("Notifikasi diblokir. Aktifkan di pengaturan browser.", {
        icon: "🔕",
      });
      return;
    }

    if (currentPerm === "default") {
      const result = await requestNotificationPermission();
      setNotifPermission(result);

      if (result === "granted") {
        const sub = await subscribePushNotification();
        if (sub) {
          toast.success("Notifikasi push berhasil diaktifkan! 🔔");
        }
      } else if (result === "denied") {
        toast("Notifikasi ditolak. Kamu bisa mengaktifkannya di pengaturan browser.", {
          icon: "🔕",
        });
      }
      return;
    }

    // Already granted — ensure subscription is active
    if (currentPerm === "granted") {
      const sub = await subscribePushNotification();
      if (sub) {
        toast.success("Notifikasi push aktif! 🔔");
      } else {
        toast("Gagal berlangganan notifikasi push.", { icon: "⚠️" });
      }
    }
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
          {/* Notification bell */}
          <button
            className={`app-navbar__bell ${notifPermission === "granted" ? "app-navbar__bell--active" : ""}`}
            title="Notifikasi"
            aria-label="Notifikasi"
            onClick={handleBellClick}
            id="notification-bell-btn"
          >
            <BellIcon />
            {notifPermission === "granted" && (
              <span className="app-navbar__bell-dot" />
            )}
          </button>

          {/* Profile Avatar + Dropdown */}
          <div className="profile-dropdown-wrapper" ref={dropdownRef}>
            <button
              className="app-navbar__avatar-btn"
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-label="Menu profil"
              aria-expanded={dropdownOpen}
              id="profile-avatar-btn"
            >
              <div className="app-navbar__avatar">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <ChevronDownIcon />
            </button>

            {dropdownOpen && (
              <div className="profile-dropdown" id="profile-dropdown">
                <div className="profile-dropdown__info">
                  <div className="profile-dropdown__avatar">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="profile-dropdown__text">
                    <span className="profile-dropdown__name">
                      {user?.name || "User"}
                    </span>
                    <span className="profile-dropdown__email">
                      {user?.email || "—"}
                    </span>
                  </div>
                </div>
                <div className="profile-dropdown__divider" />
                <button
                  className="profile-dropdown__logout"
                  onClick={() => {
                    setDropdownOpen(false);
                    setShowLogoutConfirm(true);
                  }}
                  id="dropdown-logout-btn"
                >
                  <LogoutIcon />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
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
