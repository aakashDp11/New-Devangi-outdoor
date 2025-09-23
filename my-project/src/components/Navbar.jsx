import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import logo1 from "../assets/d3.png";
import { getUnreadNotificationsCount } from "../services/notificationService";
import {
  FaHome,
  FaBoxOpen,
  FaCalendarCheck,
  FaFileAlt,
  FaUsers,
  FaChartBar,
  FaRupeeSign,
  FaImages,
  FaArrowLeft,
  FaArrowRight,
  FaShieldAlt,
  FaSignOutAlt,
  FaExclamationCircle,
  FaBell,
  FaFileInvoice, // For invoices
} from "react-icons/fa";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const { logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems = [
    { label: "Home", path: "/home", icon: <FaHome /> },
    { label: "Inventories", path: "/inventory", icon: <FaBoxOpen /> },
    { label: "Bookings", path: "/booking-dashboard", icon: <FaCalendarCheck /> },
    { label: "Proposals", path: "/proposal-dashboard", icon: <FaFileAlt /> },
    { label: "Users", path: "/users", icon: <FaUsers /> },
    { label: "Reports", path: "/reports", icon: <FaChartBar /> },
    { label: "Finances", path: "/finances", icon: <FaRupeeSign /> },
    
    // NEW: Invoice Management Section
    { label: "Invoices", path: "/invoices", icon: <FaFileInvoice /> },
    
    { label: "Gallery", path: "/gallery", icon: <FaImages /> },
    {
      label: "Support Tickets",
      path: "/tickets",
      icon: <FaFileInvoice />, // You might want to use a different icon for tickets
    },
    {
      label: "Notifications",
      path: "/notifications",
      icon: <FaBell />,
      badge: unreadCount,
    },
  ];

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await getUnreadNotificationsCount();
        if (response.data) {
          setUnreadCount(response.data.count);
        }
      } catch (error) {
        console.error("Failed to fetch unread notification count:", error);
      }
    };
    fetchCount();
  }, [location.pathname]);

  const handleToggle = () => setIsCollapsed((prev) => !prev);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    if (window.innerWidth < 768) setIsCollapsed(true);
  }, [location.pathname, setIsCollapsed]);

  return (
    <>
      {/* Overlay for mobile */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 z-20 md:hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={handleToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 h-full z-30 shadow-lg flex flex-col transition-all duration-300 ease-in-out overflow-x-hidden
          ${isCollapsed ? "w-0 md:w-24" : "w-64"}
          ${isCollapsed ? "overflow-y-hidden" : "overflow-y-auto"}
          ${isCollapsed ? "left-[-100%] md:left-0" : "left-0"}
        `}
        style={{
          backgroundColor: "var(--color-surface, #fff)",
          color: "var(--color-text)",
          borderRight: "1px solid var(--color-border)",
        }}
      >
        {/* Header */}
        <div
          className={`flex items-center p-4 border-b transition-all duration-300 relative
            ${isCollapsed ? "h-20 justify-center" : "h-24 justify-between"}
          `}
          style={{
            backgroundColor: "var(--color-surface)",
            borderColor: "var(--color-border)",
          }}
        >
          {!isCollapsed && <img src={logo1} alt="Logo" className="w-40" />}
          <button
            onClick={handleToggle}
            className="p-2 rounded-full bg-gray-600 hover:bg-gray-700 text-white transition-colors duration-200"
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? <FaArrowRight size={16} /> : <FaArrowLeft size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={`pt-4 space-y-1 ${!isCollapsed ? "flex-grow" : ""}`}>
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== "/home" && location.pathname.startsWith(item.path));

            return (
              <div
                key={item.label}
                onClick={() => {
                  navigate(item.path);
                  if (window.innerWidth < 768) setIsCollapsed(true);
                }}
                className={`cursor-pointer transition-colors duration-200 mx-0 ${
                  isActive ? 'bg-gray-600 text-white' : 'bg-transparent hover:bg-gray-100'
                }`}
                style={{
                  color: isActive ? "#fff" : "var(--color-text)",
                }}
                title={item.label}
              >
                <div
                  className={`flex items-center relative ${
                    isCollapsed
                      ? "flex-col justify-center gap-1 py-2"
                      : "flex-row pl-4 gap-3 py-2"
                  }`}
                >
                  <span className={isCollapsed ? "text-sm" : "text-base"}>
                    {item.icon}
                  </span>
                  <span
                    className={`font-medium ${
                      isCollapsed ? "text-[11px] leading-tight" : "text-sm"
                    }`}
                  >
                    {item.label}
                  </span>

                  {/* Badge */}
                  {item.badge > 0 && location.pathname !== "/notifications" && (
                    <span
                      className="absolute text-white text-[10px] font-bold bg-red-600 rounded-full flex items-center justify-center"
                      style={{
                        top: isCollapsed ? "0.125rem" : "0.375rem",
                        right: isCollapsed ? "0.375rem" : "0.75rem",
                        minWidth: isCollapsed ? "1rem" : "1.25rem",
                        height: isCollapsed ? "1rem" : "1.25rem",
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          className="pt-4 pb-4"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          {isCollapsed ? (
            <div className="flex flex-col items-center space-y-1 py-1">
              <FaShieldAlt
                onClick={() => navigate("/privacy-policy")}
                className="cursor-pointer"
                style={{ color: "var(--color-text)" }}
                size={16}
                title="Privacy Policy"
              />
              <FaExclamationCircle
                onClick={() => navigate("/disclaimer-policy")}
                className="cursor-pointer"
                style={{ color: "var(--color-text)" }}
                size={16}
                title="Disclaimer Policy"
              />
              <FaSignOutAlt
                onClick={handleLogout}
                className="cursor-pointer"
                style={{ color: "var(--color-text)" }}
                size={16}
                title="Logout"
              />
            </div>
          ) : (
            <div
              className="px-2 py-3 text-center text-xs font-medium whitespace-nowrap"
              style={{ color: "var(--color-muted, #666)" }}
            >
              <span
                onClick={() => navigate("/privacy-policy")}
                className="cursor-pointer"
                style={{ color: "var(--color-text)" }}
              >
                Privacy Policy
              </span>
              <span className="mx-1 opacity-50">|</span>
              <span
                onClick={() => navigate("/disclaimer-policy")}
                className="cursor-pointer"
                style={{ color: "var(--color-text)" }}
              >
                Disclaimer Policy
              </span>
              <span className="mx-1 opacity-50">|</span>
              <span
                onClick={handleLogout}
                className="cursor-pointer"
                style={{ color: "var(--color-text)" }}
              >
                Logout
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={handleToggle}
        className="p-2 rounded-md md:hidden fixed top-4 left-4 z-40 bg-gray-600 hover:bg-gray-700 text-white transition-colors duration-200"
      >
        ☰
      </button>
    </>
  );
}