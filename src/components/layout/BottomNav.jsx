import { NavLink } from "react-router-dom";
import { navItems } from "./Sidebar";

/**
 * BottomNav — mobile bottom navigation bar (visible < 1024px)
 * Uses the same navItems as Sidebar for consistency.
 */
function BottomNav() {
  return (
    <nav className="bottom-nav" id="bottom-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `bottom-nav__item ${isActive ? "bottom-nav__item--active" : ""}`
          }
        >
          <span className="bottom-nav__icon">{item.icon}</span>
          <span className="bottom-nav__label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default BottomNav;
