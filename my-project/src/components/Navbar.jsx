

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';// Import the useAuth hook
import logo1 from '../assets/d3.png';
import {
  FaHome,
  FaBoxOpen,
  FaCalendarCheck,
  FaFileAlt,
  FaUsers,
  FaChartBar,
  FaRupeeSign,
  FaImages,
} from 'react-icons/fa';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { auth } = useAuth(); // Get the user information from AuthContext
// console.log("Auth details are",auth);
  const navItems = [
    { label: 'Home', path: '/home', icon: <FaHome /> },
    { label: 'Inventories', path: '/inventory', icon: <FaBoxOpen /> },
    { label: 'Bookings', path: '/booking-dashboard', icon: <FaCalendarCheck /> },
    { label: 'Proposals', path: '/proposal-dashboard', icon: <FaFileAlt /> },
    { label: 'Users', path: '/users', icon: <FaUsers /> },
    { label: 'Reports', path: '/reports', icon: <FaChartBar /> },
    { label: 'Finances', path: '/finances', icon: <FaRupeeSign /> },
    { label: 'Gallery', path: '/gallery', icon: <FaImages /> },
  ];

  return (
    <aside className="w-[70%] lg:w-64 bg-[#fff] text-black py-6 space-y-4 overflow-y-auto fixed top-0 left-0 bottom-0 z-10 border border-gray-300 shadow-lg">
      <div className="flex flex-col items-center ml-[5%]">
        <img className="w-[60%] mr-auto "  src={logo1} alt="Logo" />
        
        {/* Display the user's name below the logo */}
        {auth && auth.userName && (
          <p className="mt-2 mr-auto px-2 text-sm text-black font-semibold">Welcome, {auth.userName}</p> // Display user name
        )}
      </div>

      <nav className="space-y-2 text-xs">
        {navItems.map((item) => (
          <div
            key={item.label}
            onClick={() => navigate(item.path)}
            className={`cursor-pointer font-semibold px-3 pl-[10%] py-2 rounded transition ${location.pathname === item.path ? 'bg-orange-500' : 'hover:bg-gray-300 hover:text-white'}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          </div>
        ))}
      </nav>
      
      <div className="pl-[5%] text-xs space-y-1">
        <div className="px-3">Privacy Policy</div>
        {/* <div className="px-3">Disclaimer Policy</div>
        <div className="px-3">Cookie Policy</div> */}
      </div>
    </aside>
  );
}

// import React from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import { useSidebar } from '../context/SideBarContext.jsx';
// import logo1 from '../assets/d3.png';
// import {
//   FaHome,
//   FaBoxOpen,
//   FaCalendarCheck,
//   FaFileAlt,
//   FaUsers,
//   FaChartBar,
//   FaRupeeSign,
//   FaImages,
//   FaArrowRight,
//   FaArrowLeft,
// } from 'react-icons/fa';

// // Icon size for a consistent and clean look
// const iconSize = 18;

// const navItems = [
//   { label: 'Home', path: '/home', icon: <FaHome size={iconSize} /> },
//   { label: 'Inventories', path: '/inventory', icon: <FaBoxOpen size={iconSize} /> },
//   { label: 'Bookings', path: '/booking-dashboard', icon: <FaCalendarCheck size={iconSize} /> },
//   { label: 'Proposals', path: '/proposal-dashboard', icon: <FaFileAlt size={iconSize} /> },
//   { label: 'Users', path: '/users', icon: <FaUsers size={iconSize} /> },
//   { label: 'Reports', path: '/reports', icon: <FaChartBar size={iconSize} /> },
//   { label: 'Finances', path: '/finances', icon: <FaRupeeSign size={iconSize} /> },
//   { label: 'Gallery', path: '/gallery', icon: <FaImages size={iconSize} /> },
// ];

// export default function Navbar() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { logout } = useAuth();
  
//   const { isCollapsed, setIsCollapsed } = useSidebar();

//   const toggleSidebar = () => {
//     setIsCollapsed(!isCollapsed);
//   };

//   const handleLogout = () => {
//     logout();
//     navigate('/login');
//   };

//   return (
//     <aside
//       className={`bg-white text-black overflow-y-auto fixed top-0 left-0 h-full z-30 border-r border-gray-200 shadow-lg flex flex-col transition-all duration-300 ${
//         // Change: Updated expanded width from w-56 to w-64 to match the old navbar
//         isCollapsed ? 'w-20' : 'w-64'
//       }`}
//     >
//       <div className={`flex items-center h-40 px-4 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
//         {!isCollapsed && (
//           // Change: Adjusted logo width to fit the new sidebar size
//           <img className="w-36" src={logo1} alt="Logo" />
//         )}
//         <button
//           onClick={toggleSidebar}
//           className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none"
//         >
//           {isCollapsed ? <FaArrowRight size={18} /> : <FaArrowLeft size={18} />}
//         </button>
//       </div>

//       <nav className="flex-grow pt-2">
//         {navItems.map((item) => (
//           <div
//             key={item.label}
//             onClick={() => navigate(item.path)}
//             className={`
//               cursor-pointer font-semibold transition-all duration-300
//               ${location.pathname.startsWith(item.path) ? 'bg-orange-600 text-white' : 'hover:bg-gray-100 text-gray-700'}
//             `}
//             title={item.label} // Tooltip for collapsed state
//           >
//             <div className={`
//               flex items-center
//               ${isCollapsed 
//                 ? 'flex-col justify-center items-center py-3 px-2 gap-1.5' 
//                 : 'flex-row py-3 px-4 gap-4'
//               }
//             `}>
//               {item.icon}
//               <span className={`transition-all duration-200 ${isCollapsed ? 'text-[11px] font-medium' : 'text-sm'}`}>
//                 {item.label}
//               </span>
//             </div>
//           </div>
//         ))}
//       </nav>

//       {!isCollapsed && (
//         <div className="px-4 py-3 mt-auto text-xs font-semibold text-gray-500 whitespace-nowrap border-t border-gray-200">
//           <span
//             onClick={() => navigate('/privacy-policy')}
//             className="cursor-pointer hover:text-blue-600 transition"
//           >
//             Privacy Policy
//           </span>
//           <span className="mx-1">|</span>
//           <span
//             onClick={() => navigate('/disclaimer-policy')}
//             className="cursor-pointer hover:text-blue-600 transition"
//           >
//             Disclaimer Policy
//           </span>
//           <span className="mx-1">|</span>
//           <span
//             onClick={handleLogout}
//             className="cursor-pointer hover:text-red-600 transition"
//           >
//             Logout
//           </span>
//         </div>
//       )}
//     </aside>
//   );
// }