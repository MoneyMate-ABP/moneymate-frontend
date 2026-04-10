import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import useAuthStore from "../../store/authStore";
import useNotificationHistory from "../../hooks/useNotificationHistory";

/* ── SVG Icons ─────────────────────────────────────────── */
const WalletIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const BellIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

function Navbar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [isOpen, setIsOpen] = useState(false);
  const bellContainerRef = useRef(null);

  const { history, unreadCount, loading, markRead, markAllRead } =
    useNotificationHistory();

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const unreadBadgeLabel = useMemo(() => {
    if (unreadCount <= 0) return "";
    if (unreadCount > 9) return "9+";
    return String(unreadCount);
  }, [unreadCount]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const onDocumentClick = (event) => {
      if (!bellContainerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", onDocumentClick);
    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
    };
  }, [isOpen]);

  const handleBellClick = () => {
    setIsOpen((current) => !current);
  };

  const formatRupiah = (value) => {
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(value || 0));
  };

  const formatRelativeDay = (value) => {
    const sentDay = dayjs(value).startOf("day");
    const today = dayjs().startOf("day");
    const diffDays = today.diff(sentDay, "day");

    if (diffDays <= 0) {
      return "hari ini";
    }

    if (diffDays === 1) {
      return "kemarin";
    }

    return `${diffDays} hari lalu`;
  };

  const handleMarkRead = async (notification) => {
    if (!notification?.id || notification.is_read) {
      return;
    }

    await markRead(notification.id);
  };

  const handleMarkAllRead = async () => {
    if (unreadCount <= 0) {
      return;
    }

    await markAllRead();
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
          <div className="navbar-notification" ref={bellContainerRef}>
            <button
              className={`app-navbar__bell ${unreadCount > 0 ? "app-navbar__bell--active" : ""}`}
              title="Notifikasi"
              aria-label="Notifikasi"
              aria-expanded={isOpen}
              onClick={handleBellClick}
              id="notification-bell-btn"
            >
              <BellIcon />
              {unreadCount > 0 && (
                <span className="app-navbar__bell-count">
                  {unreadBadgeLabel}
                </span>
              )}
            </button>

            {isOpen && (
              <div
                className="notification-dropdown"
                role="dialog"
                aria-label="Riwayat notifikasi"
              >
                <div className="notification-dropdown__header">
                  <h4>Notifikasi</h4>
                  {unreadCount > 0 && (
                    <span className="notification-dropdown__unread">
                      {unreadCount} belum dibaca
                    </span>
                  )}
                </div>

                <div className="notification-dropdown__content">
                  {!loading && history.length === 0 && (
                    <p className="notification-dropdown__empty">
                      Belum ada notifikasi
                    </p>
                  )}

                  {loading && (
                    <p className="notification-dropdown__empty">
                      Memuat notifikasi...
                    </p>
                  )}

                  {!loading && history.length > 0 && (
                    <ul className="notification-list">
                      {history.map((item) => {
                        const carryOverValue = Number(item.carry_over || 0);
                        const carryClass =
                          carryOverValue > 0
                            ? "notification-item__carry--positive"
                            : carryOverValue < 0
                              ? "notification-item__carry--negative"
                              : "notification-item__carry--neutral";
                        const carryPrefix = carryOverValue > 0 ? "+" : "";

                        return (
                          <li key={item.id}>
                            <button
                              className={`notification-item ${item.is_read ? "" : "notification-item--unread"}`}
                              onClick={() => handleMarkRead(item)}
                            >
                              <div className="notification-item__top">
                                <strong>{item.title}</strong>
                                <span>{formatRelativeDay(item.sent_at)}</span>
                              </div>
                              <p>{item.body}</p>
                              <div className="notification-item__meta">
                                <span>
                                  Budget efektif: Rp{" "}
                                  {formatRupiah(item.effective_budget)}
                                </span>
                                <span
                                  className={`notification-item__carry ${carryClass}`}
                                >
                                  Carry over: {carryPrefix}Rp{" "}
                                  {formatRupiah(carryOverValue)}
                                </span>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="notification-dropdown__footer">
                  <button
                    className="notification-dropdown__markall"
                    type="button"
                    disabled={loading || unreadCount <= 0}
                    onClick={handleMarkAllRead}
                  >
                    Tandai semua dibaca
                  </button>
                </div>
              </div>
            )}
          </div>

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
