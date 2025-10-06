import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import logo1 from '../assets/d3.png';
import { useAuth } from '../context/AuthContext';
import { FiRefreshCw } from 'react-icons/fi';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState(''); // Added username state
  const [password, setPassword] = useState('');

  const [captcha, setCaptcha] = useState('');
  const [userCaptcha, setUserCaptcha] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  const { setAuth } = useAuth();

  const generateCaptcha = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptcha(result);
  }, []);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (userCaptcha.toLowerCase() !== captcha.toLowerCase()) {
      setCaptchaError('Incorrect CAPTCHA. Please try again.');
      generateCaptcha();
      setUserCaptcha('');
      return;
    } else {
      setCaptchaError('');
    }

    try {
      // Sending email, username, and password to the API
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, { email, username, password });
      const { accessToken, user } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('userName', user.name);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('userId', user.id);
      // Also store username if it comes back from API
      if (user.username) {
        localStorage.setItem('userUsername', user.username);
      }


      toast.success('Login successful!');
      setAuth({ token: accessToken, userName: user.name, role: user.role });
      navigate('/home');
    } catch (error) {
      toast.error(`Login failed: ${error.response?.data?.message || error.message}`);
      generateCaptcha();
      setUserCaptcha('');
    }
  };

  return (
    // Updated background to match the gradient theme
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col justify-center items-center p-4">
      
      {/* Updated card styling: rounded-2xl, shadow-2xl, animate-slideDown */}
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm animate-slideDown">
        <img className="w-40 mx-auto mb-6" src={logo1} alt="Company Logo" />

        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Log in</h2>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Input field styling updated: rounded-xl, focus:ring-indigo-500 */}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
            required
          />
          {/* Username input removed as per original Login code structure */}
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
            required
          />

          <div>
            <div className="flex items-center space-x-2">
              <div className="w-1/2 h-12 flex items-center justify-center bg-gray-200 rounded-xl">
                <span
                  className="text-2xl font-bold tracking-widest text-gray-700 select-none"
                  style={{ textDecoration: 'line-through', fontStyle: 'italic' }}
                >
                  {captcha}
                </span>
              </div>
              {/* CAPTCHA Refresh button updated to use indigo hover color */}
              <button type="button" onClick={generateCaptcha} className="p-3 text-gray-600 hover:text-indigo-500 transition duration-200">
                <FiRefreshCw size={24} />
              </button>
            </div>
            <input
              type="text"
              placeholder="Enter CAPTCHA"
              value={userCaptcha}
              onChange={(e) => setUserCaptcha(e.target.value)}
              // CAPTCHA input updated with rounded-xl and indigo focus ring
              className={`mt-2 w-full px-4 py-3 border ${
                captchaError ? 'border-red-500' : 'border-gray-300'
              } rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200`}
              required
            />
            {captchaError && (
              <p className="text-red-500 text-sm mt-1">{captchaError}</p>
            )}
          </div>

          <div className="text-right">
            {/* Forgot password link updated to use indigo color */}
            <Link to="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition duration-200">
              Forgot password?
            </Link>
          </div>

          {/* Submit button updated to use indigo color and rounded-xl */}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl transition duration-300 ease-in-out hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 shadow-md"
          >
            Sign in
          </button>
        </form>
        
        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link 
            to="/register" 
            // Styled link consistent with indigo theme
            className="font-semibold text-indigo-600 hover:text-indigo-700 transition duration-200"
          >
            Sign Up
          </Link>
        </p>

      </div>

      {/* Animation Styles (Copied from Register.jsx) */}
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

export default Login;
