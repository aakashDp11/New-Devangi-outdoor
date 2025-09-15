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
    <div className="fixed inset-0 bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
        <img className="w-40 mx-auto mb-6" src={logo1} alt="Company Logo" />

        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Log in</h2>

        <form onSubmit={handleLogin} className="space-y-5">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
          {/* --- ADDED THIS SECTION --- */}
          
          {/* --- END OF ADDED SECTION --- */}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />

          <div>
            <div className="flex items-center space-x-2">
              <div className="w-1/2 h-12 flex items-center justify-center bg-gray-200 rounded-lg">
                <span
                  className="text-2xl font-bold tracking-widest text-gray-700 select-none"
                  style={{ textDecoration: 'line-through', fontStyle: 'italic' }}
                >
                  {captcha}
                </span>
              </div>
              <button type="button" onClick={generateCaptcha} className="p-3 text-gray-600 hover:text-orange-500">
                <FiRefreshCw size={24} />
              </button>
            </div>
            <input
              type="text"
              placeholder="Enter CAPTCHA"
              value={userCaptcha}
              onChange={(e) => setUserCaptcha(e.target.value)}
              className={`mt-2 w-full px-4 py-3 border ${
                captchaError ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500`}
              required
            />
            {captchaError && (
              <p className="text-red-500 text-sm mt-1">{captchaError}</p>
            )}
          </div>

          <div className="text-right">
            <Link to="/forgot-password" className="text-sm font-medium text-orange-600 hover:text-orange-800">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Sign in
          </button>
        </form>

      </div>
    </div>
  );
}

export default Login;