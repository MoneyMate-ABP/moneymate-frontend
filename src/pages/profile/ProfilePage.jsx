import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { logoutUser } from "../../services/authService";
import ConfirmModal from "../../components/ConfirmModal";
import toast from "react-hot-toast";
import {
  isPushSupported,
  requestNotificationPermission,
  subscribePushNotification,
  unsubscribePushNotification,
} from "../../services/notificationService";

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

  const [pushSupported, setPushSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    // MOCK: Simpan preferensi simulasi ke localStorage agar tidak ter-reset
    setPushSupported(true);
    const savedState = localStorage.getItem("mockPushSub");
    if (savedState !== null) {
      setIsSubscribed(savedState === "true");
    } else {
      setIsSubscribed(true); // Default anggap sudah langganan
      localStorage.setItem("mockPushSub", "true");
    }

    /* Original Logic:
    const supported = isPushSupported();
    setPushSupported(supported);
    
    if (supported) {
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(Boolean(sub));
      }).catch(() => {
        // service worker not available or failed
      });
    }
    */
  }, []);

  const handleToggleNotification = async (e) => {
    if (isSubscribed) {
      e.preventDefault();
      setShowDisableConfirm(true);
      return;
    }

    setToggling(true);

    // MOCK: Toggle state directly tanpa panggil backend/service worker sungguhan
    setTimeout(() => {
      setIsSubscribed(true);
      localStorage.setItem("mockPushSub", "true");
      toast.success("Notifikasi push diaktifkan! 🔔");
      setToggling(false);
    }, 300);
  };

  const confirmDisableNotification = () => {
    setIsSubscribed(false);
    localStorage.setItem("mockPushSub", "false");
    setShowDisableConfirm(false);
    toast("Notifikasi dimatikan.", { icon: "🔕" });
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

  const handleTestNotification = async () => {
    try {
      // Paksa minta izin asli browser terlebih dahulu bila belum
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        toast.error("Browser tidak memberi izin notifikasi OS.");
        return;
      }

      // Memunculkan native OS Notification melalui Service Worker
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification("MoneyMate", {
        body: `Hai ${user?.name || ''} Jangan lupa Irit ya cur`,
        icon: "/vite.svg"
      });

    } catch (err) {
      // Fallback bila service worker terkendala, langsung panggil API Notification biasa
      try {
        new Notification("MoneyMate", {
          body: `Hai ${user?.name || ''} Jangan lupa Irit ya cur`,
          icon: "/vite.svg"
        });
      } catch (e) {
        toast.error("Gagal memunculkan notifikasi OS native.");
      }
    }
  };

  const handleMorningNotification = async () => {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        toast.error("Izin notifikasi belum diberikan.");
        return;
      }

      // Simulasi Budget, idealnya didapat dari state/store
      const dummyBudget = "50.000";

      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification("Pengingat Pagi ☀️", {
        body: `Hai ${user?.name || "User"}! Budget anda hari ini Rp. ${dummyBudget}. Jangan boros-boros yaa!`,
        icon: "/vite.svg"
      });
    } catch (err) {
      try {
        new Notification("Pengingat Pagi ☀️", {
          body: `Hai ${user?.name || "User"}! Budget anda hari ini Rp. 50.000. Jangan boros-boros yaa!`,
          icon: "/vite.svg"
        });
      } catch (e) {
        // Abaikan
      }
    }
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
                <h3>Notifikasi Web Push</h3>
                <p>Terima pemberitahuan anggaran harian</p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {isSubscribed && (
                <div className="btn-appear" style={{ display: "flex", gap: "10px" }}>
                  <button
                    className="btn btn-primary"
                    style={{ padding: "4px 12px", fontSize: "0.75rem", borderRadius: "100px", background: "#f39c12", borderColor: "#f39c12" }}
                    onClick={handleMorningNotification}
                    title="Simulasi Notifikasi Jam 8 Pagi"
                  >
                    Set 8 Pagi
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ padding: "4px 12px", fontSize: "0.75rem", borderRadius: "100px" }}
                    onClick={handleTestNotification}
                  >
                    Test
                  </button>
                </div>
              )}
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={isSubscribed}
                  onChange={handleToggleNotification}
                  disabled={!pushSupported}
                  id="notification-toggle"
                />
                <span className="toggle-switch__slider"></span>
              </label>
            </div>
          </div>
        </div>

        <h3 className="profile-section-title profile-section-title--danger">Akun</h3>

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
