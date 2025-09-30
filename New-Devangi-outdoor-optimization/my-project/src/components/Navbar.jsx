import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { useAuth } from '../context/AuthContext';
import logo1 from '../assets/d3.png';
import { getUnreadNotificationsCount } from '../services/notificationService';
import {
  FaHome, FaBoxOpen, FaCalendarCheck, FaFileAlt, FaUsers,
  FaChartBar, FaRupeeSign, FaImages, FaArrowLeft, FaArrowRight,
  FaShieldAlt, FaSignOutAlt, FaExclamationCircle, FaBell
} from 'react-icons/fa';


export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation(); // We will use this to check the current path
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const { logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const navItems = [
    { label: 'Home', path: '/home', icon: <FaHome /> },
    { label: 'Inventories', path: '/inventory', icon: <FaBoxOpen /> },
    { label: 'Bookings', path: '/booking-dashboard', icon: <FaCalendarCheck /> },
    { label: 'Proposals', path: '/proposal-dashboard', icon: <FaFileAlt /> },
    { label: 'Users', path: '/users', icon: <FaUsers /> },
    { label: 'Reports', path: '/reports', icon: <FaChartBar /> },
    { label: 'Finances', path: '/finances', icon: <FaRupeeSign /> },
    { label: 'Gallery', path: '/gallery', icon: <FaImages /> },
    {
      label: 'Notifications',
      path: '/notifications',
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

  const handleToggle = () => setIsCollapsed(prev => !prev);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const closeSidebarOnMobile = () => {
      if (window.innerWidth < 768) setIsCollapsed(true);
    };
    closeSidebarOnMobile();
  }, [location.pathname, setIsCollapsed]);

  return (
    <>
      {/* Overlay for mobile when sidebar is open */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={handleToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-white text-black fixed top-0 h-full z-30 border-r border-gray-200 shadow-lg flex flex-col transition-all duration-300 ease-in-out overflow-x-hidden
          ${isCollapsed ? 'w-0 md:w-24' : 'w-64'}
          ${isCollapsed ? 'overflow-y-hidden' : 'overflow-y-auto'}
          ${isCollapsed ? 'left-[-100%] md:left-0' : 'left-0'}
        `}
      >
        {/* Header */}
        <div
          className={`flex items-center p-4 border-b border-gray-200 transition-all duration-300 relative
            ${isCollapsed ? 'h-20 justify-center' : 'h-24 justify-between'}
          `}
        >
          {!isCollapsed && (
            <img src={logo1} alt="Logo" className="w-40" />
          )}
          <button
            onClick={handleToggle}
            className={`p-2 rounded-full text-gray-600 hover:bg-gray-100 focus:outline-none 
              ${isCollapsed ? '' : 'absolute top-5 right-4 bg-gray-50'}`}
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? <FaArrowRight size={16} /> : <FaArrowLeft size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className={`pt-4 space-y-1 ${!isCollapsed ? 'flex-grow' : ''}`}>
          {navItems.map(item => {
            const isActive = location.pathname === item.path || (item.path !== '/home' && location.pathname.startsWith(item.path));
            
            return (
              <div
                key={item.label}
                onClick={() => {
                  navigate(item.path);
                  if (window.innerWidth < 768) setIsCollapsed(true);
                }}
                className={`cursor-pointer transition-colors duration-200 mx-0 ${
                  isActive
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={item.label}
              >
                <div
                  className={`flex items-center relative ${
                    isCollapsed
                      ? 'flex-col justify-center gap-1 py-2'
                      : 'flex-row pl-4 gap-3 py-2'
                  }`}
                >
                  <span className={isCollapsed ? 'text-sm' : 'text-base'}>{item.icon}</span>
                  <span
                    className={`font-medium ${
                      isCollapsed ? 'text-[11px] leading-tight' : 'text-sm'
                    }`}
                  >
                    {item.label}
                  </span>

                  {/* --- ✅ THIS IS THE UPDATED CODE --- */}
                  {/* Show badge only if count > 0 AND we are NOT on the notifications page */}
                  {item.badge > 0 && location.pathname !== '/notifications' && (
                    <span
                      className={`absolute text-white text-[10px] font-bold bg-red-500 rounded-full flex items-center justify-center
                        ${isCollapsed
                          ? 'top-0.5 right-1.5 min-w-[1rem] h-4 px-1' // Adjusted for better fitting of numbers
                          : 'top-1.5 right-3 min-w-[1.25rem] h-5 px-1.5' // Adjusted for better fitting of numbers
                        }
                      `}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer Links */}
        <div className="border-t border-gray-200 pt-4 pb-4">
          {isCollapsed ? (
            <div className="flex flex-col items-center space-y-1 py-1">
              <FaShieldAlt
                onClick={() => navigate('/privacy-policy')}
                className="cursor-pointer text-gray-500 hover:text-orange-500"
                size={16}
                title="Privacy Policy"
              />
              <FaExclamationCircle
                onClick={() => navigate('/disclaimer-policy')}
                className="cursor-pointer text-gray-500 hover:text-orange-500"
                size={16}
                title="Disclaimer Policy"
              />
              <FaSignOutAlt
                onClick={handleLogout}
                className="cursor-pointer text-gray-500 hover:text-orange-500"
                size={16}
                title="Logout"
              />
            </div>
          ) : (
            <div className="px-2 py-3 text-center text-xs font-medium text-gray-600 whitespace-nowrap">
              <span onClick={() => navigate('/privacy-policy')} className="cursor-pointer hover:text-orange-500">
                Privacy Policy
              </span>
              <span className="mx-1 text-gray-300">|</span>
              <span onClick={() => navigate('/disclaimer-policy')} className="cursor-pointer hover:text-orange-500">
                Disclaimer Policy
              </span>
              <span className="mx-1 text-gray-300">|</span>
              <span onClick={handleLogout} className="cursor-pointer hover:text-orange-500">
                Logout
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* Hamburger Toggle for Mobile */}
      <button
        onClick={handleToggle}
        className="md:hidden fixed top-4 left-4 z-40 bg-white border p-2 rounded shadow-lg"
      >
        ☰
      </button>
    </>
  );
}