import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { logoutUser } from "../../services/authService";
import ConfirmModal from "../../components/ConfirmModal";
import toast from "react-hot-toast";
import usePushNotification from "../../hooks/usePushNotification";

/* ── SVG Icons ─────────────────────────────────────────── */
const BackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDisableConfirm, setShowDisableConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [iosRequiresInstall, setIosRequiresInstall] = useState(false);

  const { isSupported, permission, isSubscribed, subscribe, unsubscribe } =
    usePushNotification();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const isIos = /iPad|iPhone|iPod/i.test(window.navigator.userAgent);
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;

    setIosRequiresInstall(isIos && !isStandalone);
  }, []);

  const notificationToggleDisabled =
    toggling || !isSupported || permission === "denied" || iosRequiresInstall;

  const handleToggleNotification = async (e) => {
    if (isSubscribed) {
      e.preventDefault();
      setShowDisableConfirm(true);
      return;
    }

    if (notificationToggleDisabled) {
      return;
    }

    setToggling(true);

    try {
      const subscribed = await subscribe();
      if (!subscribed) {
        if (permission === "denied") {
          toast.error("Izin notifikasi diblokir di browser.");
          return;
        }

        toast.error("Gagal mengaktifkan notifikasi push.");
        return;
      }

      if (!import.meta.env.DEV) {
        toast.success("Notifikasi harian jam 08:00 berhasil diaktifkan.");
      }
    } finally {
      setToggling(false);
    }
  };

  const confirmDisableNotification = async () => {
    setToggling(true);

    const success = await unsubscribe();
    if (!success) {
      toast.error("Gagal mematikan notifikasi push.");
      setToggling(false);
      return;
    }

    if (!import.meta.env.DEV) {
      toast("Notifikasi dimatikan.", { icon: "🔕" });
    }

    setShowDisableConfirm(false);
    setToggling(false);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutUser();
    } catch {
      // Ignore API err during logout
    }
    logout();
    toast.success("Berhasil logout!");
    navigate("/login", { replace: true });
  };

  return (
    <div className="page-container">
      <main className="dashboard-main">
        {/* Header */}
        <div className="category-page__header">
          <button
            className="category-page__back"
            onClick={() => navigate("/")}
            id="back-profile-btn"
          >
            <BackIcon />
          </button>
          <div>
            <h1 id="profile-title">Profil Saya</h1>
            <p>Pengaturan akun dan preferensi</p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="profile-card">
          <div className="profile-card__avatar-large">
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <h2 className="profile-card__name">{user?.name || "User"}</h2>
          <p className="profile-card__email">{user?.email || "—"}</p>
        </div>

        <h3 className="profile-section-title">Pengaturan Aplikasi</h3>

        {/* Actions List */}
        <div className="profile-actions-container">
          <div className="profile-action-item">
            <div className="profile-action-item__left">
              <div className="profile-action-item__icon profile-action-item__icon--primary">
                <BellIcon />
              </div>
              <div className="profile-action-item__text">
                <h3>Notifikasi harian jam 08:00</h3>
                {iosRequiresInstall && (
                  <p>
                    Install app ke homescreen dulu untuk aktifkan notifikasi
                  </p>
                )}
                {!iosRequiresInstall && !isSupported && (
                  <p>Browser kamu belum mendukung Web Push Notification.</p>
                )}
                {!iosRequiresInstall &&
                  isSupported &&
                  permission === "denied" && (
                    <p>
                      Izin notifikasi diblokir. Aktifkan lagi dari pengaturan
                      browser.
                    </p>
                  )}
                {!iosRequiresInstall &&
                  isSupported &&
                  permission !== "denied" && (
                    <p>
                      Terima ringkasan budget efektif harian langsung dari
                      sistem.
                    </p>
                  )}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={isSubscribed}
                  onChange={handleToggleNotification}
                  disabled={notificationToggleDisabled}
                  id="notification-toggle"
                />
                <span className="toggle-switch__slider"></span>
              </label>
            </div>
          </div>
        </div>

        <h3 className="profile-section-title profile-section-title--danger">
          Akun
        </h3>

        <div className="profile-actions-container">
          <button
            className="profile-action-item profile-action-item--clickable"
            onClick={() => setShowLogoutConfirm(true)}
            id="profile-logout-btn"
          >
            <div className="profile-action-item__left">
              <div className="profile-action-item__icon profile-action-item__icon--danger">
                <LogoutIcon />
              </div>
              <div className="profile-action-item__text">
                <h3 className="text-danger">Logout dari Aplikasi</h3>
                <p>Sesi aktif kamu akan ditutup</p>
              </div>
            </div>
          </button>
        </div>
      </main>

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

      <ConfirmModal
        isOpen={showDisableConfirm}
        onClose={() => setShowDisableConfirm(false)}
        onConfirm={confirmDisableNotification}
        title="Matikan Notifikasi?"
        message="Yakin ingin mematikan notifikasi peringatan anggaran?"
        warning="Kamu mungkin akan melewatkan info penting soal keuanganmu jika ini dimatikan."
        confirmText="Ya, Matikan"
        cancelText="Batal"
        icon="🔕"
        variant="danger"
      />
    </div>
  );
}
