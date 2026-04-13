import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import InstallPrompt from "../InstallPrompt";

/**
 * AppLayout — main layout for authenticated pages.
 * Desktop (≥1024px): Navbar + Sidebar + Content
 * Mobile (<1024px): Navbar + Content + BottomNav
 */
function AppLayout() {
  return (
    <div className="app-layout">
      <Navbar />
      <div className="app-layout__body">
        <Sidebar />
        <main className="app-layout__content">
          <Outlet />
        </main>
      </div>
      <BottomNav />
      <InstallPrompt />
    </div>
  );
}

export default AppLayout;
