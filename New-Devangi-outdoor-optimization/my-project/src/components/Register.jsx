import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import logo1 from '../assets/d3.png';

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/register`, { name, username, phone, email, password });
      toast.success('Registration successful! Please sign in.');
      navigate('/login');
    } catch (error) {
      toast.error(`Registration failed: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    // Updated background to match the gradient theme
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col justify-center items-center p-4">
      
      {/* Updated card styling */}
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm animate-slideDown">
        <img className="w-40 mx-auto mb-6" src={logo1} alt="Company Logo" />

        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Create an Account</h2>

        <form onSubmit={handleRegister} className="space-y-5">
          {/* Input field styling updated */}
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            // Updated classes: rounded-xl, focus:ring-indigo-500
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
            required
          />
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            // Updated classes: rounded-xl, focus:ring-indigo-500
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
            required
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            // Updated classes: rounded-xl, focus:ring-indigo-500
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            // Updated classes: rounded-xl, focus:ring-indigo-500
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            // Updated classes: rounded-xl, focus:ring-indigo-500
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
            required
          />

          {/* Updated button styling to match indigo theme */}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl transition duration-300 ease-in-out hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 shadow-md"
          >
            Sign Up
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link 
            to="/login" 
            // Styled link consistent with indigo theme
            className="font-semibold text-indigo-600 hover:text-indigo-700 transition duration-200"
          >
            Sign In
          </Link>
        </p>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown { animation: slideDown 0.4s ease-out; }
      `}</style>
    </div>
  );
}

export default Register;
