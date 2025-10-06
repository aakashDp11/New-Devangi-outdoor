import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo1 from '../assets/d3.png';

export default function InternalServerError() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-gray-100 flex items-center justify-center z-50">
      <div className="text-center">
        <img src={logo1} alt="Logo" className="w-80" />
        <h1 className="text-6xl font-bold text-red-600">500</h1>
        <p className="text-xl mt-4">Internal Server Error</p>
        <button
          onClick={() => navigate('/home')}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}