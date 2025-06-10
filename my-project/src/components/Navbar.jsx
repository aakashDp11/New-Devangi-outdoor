import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo1 from '../assets/d3.png'
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

  const navItems = [
    { label: 'Home', path: '/home', icon: <FaHome /> },
    { label: 'Inventories', path: '/', icon: <FaBoxOpen /> },
    { label: 'Bookings', path: '/booking-dashboard', icon: <FaCalendarCheck /> },
    { label: 'Proposals', path: '/proposal-dashboard', icon: <FaFileAlt /> },
    { label: 'Users', path: '/users', icon: <FaUsers /> },
    { label: 'Reports', path: '/reports', icon: <FaChartBar /> },
    { label: 'Finances', path: '/finances', icon: <FaRupeeSign /> },
    { label: 'Gallery', path: '/gallery', icon: <FaImages /> },
  ];

  return (
    <aside className="w-[80%] lg:w-64 bg-[#fff] text-black p-6 space-y-4 overflow-y-auto fixed top-0 left-0 bottom-0 z-10 border border-gray-300">
      <div className='flex'>
        <img className='w-[80%]' src={logo1} alt="Logo" />
      </div>
      <nav className="space-y-2 text-xs">
        {navItems.map((item) => (
          <div
            key={item.label}
            onClick={() => navigate(item.path)}
            className={`cursor-pointer font-semibold px-3 py-2 rounded transition ${location.pathname === item.path ? 'bg-orange-500' : 'hover:bg-gray-300 hover:text-white'}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          </div>
        ))}
      </nav>
      <div className="mt-10 text-xs space-y-1">
        <div className="px-3">Privacy Policy</div>
        <div className="px-3">Disclaimer Policy</div>
        <div className="px-3">Cookie Policy</div>
      </div>
    </aside>
  );
}
// export default function Navbar() {
//   const navigate = useNavigate();
//   const location = useLocation();

//   const navItems = [
//     { label: 'Home', path: '/home' },
//     { label: 'Inventories', path: '/' },
//     { label: 'Bookings', path: '/booking-dashboard' },
//     { label: 'Proposals', path: '/proposal-dashboard' },
//     { label: 'Users', path: '/users' },
//     { label: 'Reports', path: '/reports' },
//     { label: 'Finances', path: '/finances' },
//     { label: 'Gallery', path: '/gallery' },
//     // { label: 'Leads', path: '/leads' },
//   ];

//   return (
//     <aside className="w-[80%] lg:w-64 bg-[#fff] text-black p-6 space-y-4 overflow-y-auto fixed top-0 left-0 bottom-0 z-10 border border-gray-300">
//       <div className='flex'>
//        <img className='w-[80%]' src={logo1}/>
//       {/* <div className="text-2xl font-bold">Devangi</div> */}
//       </div>
//       <nav className="space-y-2 text-xs">
//         {navItems.map((item) => (
//           <div
//             key={item.label}
//             onClick={() => navigate(item.path)}
//             className={`cursor-pointer font-semibold px-3 py-2 rounded transition ${
//               location.pathname === item.path ? 'bg-orange-500' : 'hover:bg-gray-300 hover:text-white'
//             }`}
//           >
//             {item.label}
//           </div>
//         ))}
//       </nav>
//       <div className="mt-10 text-xs space-y-1">
//         <div className="px-3">Privacy Policy</div>
//         <div className="px-3">Disclaimer Policy</div>
//         <div className="px-3">Cookie Policy</div>
//       </div>
//     </aside>
//   );
// }

