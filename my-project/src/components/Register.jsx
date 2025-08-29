import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import logo1 from '../assets/d3.png';

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [username, setUsername] = useState(''); // Added username state
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // Added username to the request payload
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/register`, { name, username, phone, email, password });
      toast.success('Registration successful! Please sign in.');
      // Redirect to the login page after successful registration
      navigate('/login');
    } catch (error) {
      toast.error(`Registration failed: ${error.response?.data?.message || error.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
        <img className="w-40 mx-auto mb-6" src={logo1} alt="Company Logo" />

        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Create an Account</h2>

        <form onSubmit={handleRegister} className="space-y-5">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
          {/* --- ADDED THIS SECTION --- */}
         
          {/* --- END OF ADDED SECTION --- */}
          <input
            type="tel"
            placeholder="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />

          <button
            type="submit"
            className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Sign Up
          </button>
        </form>

      </div>
    </div>
  );
}

export default Register;