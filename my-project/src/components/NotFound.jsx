import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo1 from '../assets/d3.png';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-gray-100 flex items-center justify-center z-50">
      <div className="text-center">
        <img src={logo1} alt="Logo" className="w-80" />
        <h1 className="text-6xl font-bold text-red-600">404</h1>
        <p className="text-xl mt-4">Page Not Found</p>
        <button
          // --- MODIFIED: Changed the navigation path to the correct home route ---
          onClick={() => navigate('/home')}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}