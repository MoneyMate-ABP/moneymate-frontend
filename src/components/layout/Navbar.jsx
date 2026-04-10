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

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

function Navbar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [notifPermission, setNotifPermission] = useState("default");

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

          {/* Profile Avatar */}
          <div className="profile-dropdown-wrapper">
            <button
              className="app-navbar__avatar-btn btn-click-scroll"
              onClick={() => navigate("/profile")}
              aria-label="Menu profil"
              id="profile-avatar-btn"
            >
              <div className="app-navbar__avatar">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
            </button>
          </div>
        </div>
      </header>

    </>
  );
}

export default Navbar;
