import { useState, useEffect } from "react";

/**
 * InstallPrompt component — handles native PWA install prompt logic.
 * Shows a beautiful banner when the app is installable.
 */
function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevent the default browser prompt
      e.preventDefault();
      // Store the event for later use
      setDeferredPrompt(e);
      // Show our custom banner
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Check if app is already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsVisible(false);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the native install prompt
    deferredPrompt.prompt();

    // Wait for the user's choice
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }

    // Clear the prompt and hide banner
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Optionally save dismiss state to localStorage to not bother user again for some time
    localStorage.setItem("pwa_install_dismissed", Date.now().toString());
  };

  // Logic to not show if dismissed recently (e.g., within 7 days)
  useEffect(() => {
    const dismissedAt = localStorage.getItem("pwa_install_dismissed");
    if (dismissedAt) {
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - parseInt(dismissedAt) < sevenDays) {
        setIsVisible(false);
      }
    }
  }, [deferredPrompt]);

  if (!isVisible) return null;

  return (
    <div className="install-prompt-banner">
      <div className="install-prompt-banner__content">
        <div className="install-prompt-banner__icon">✨</div>
        <div className="install-prompt-banner__text">
          <strong>MoneyMate Lebih Nyaman di Homescreen!</strong>
          <span>Install aplikasi untuk akses lebih cepat dan pengalaman full-screen.</span>
        </div>
      </div>
      <div className="install-prompt-banner__actions">
        <button className="btn btn-ghost btn-sm" onClick={handleDismiss}>
          Nanti Saja
        </button>
        <button className="btn btn-primary btn-sm" onClick={handleInstallClick}>
          Install Sekarang
        </button>
      </div>
    </div>
  );
}

export default InstallPrompt;
