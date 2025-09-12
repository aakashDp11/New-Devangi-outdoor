import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import logo1 from '../assets/d3.png';
import { useAuth } from '../context/AuthContext';
import { FiRefreshCw } from 'react-icons/fi';
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';

function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [captcha, setCaptcha] = useState('');
  const [userCaptcha, setUserCaptcha] = useState('');
  const [captchaError, setCaptchaError] = useState('');

  const [loading, setLoading] = useState(false);

  // Error states
  const [emailError, setEmailError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Validation regex
  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateUsername = (username) =>
    /^[a-zA-Z0-9_]{3,20}$/.test(username);

  const validatePassword = (password) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);

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

    // Final check before API call
    if (!validateEmail(email.trim())) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    if (username && !validateUsername(username.trim())) {
      setUsernameError('Username must be 3–20 characters (letters, numbers, underscores only).');
      return;
    }
    if (!validatePassword(password)) {
      setPasswordError('Password must be 8+ chars, with uppercase, lowercase, number, and special character.');
      return;
    }
    if (userCaptcha.toLowerCase() !== captcha.toLowerCase()) {
      setCaptchaError('Incorrect CAPTCHA. Please try again.');
      generateCaptcha();
      setUserCaptcha('');
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/login`,
        { email: email.trim(), username: username.trim(), password }
      );

      const { accessToken, user } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('userName', user.name);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('userId', user.id);
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
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    validateEmail(email.trim()) &&
    (username ? validateUsername(username.trim()) : true) &&
    validatePassword(password) &&
    userCaptcha.length > 0;

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
        <img className="w-40 mx-auto mb-6" src={logo1} alt="Company Logo" />

        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">Log in</h2>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => {
                if (!validateEmail(email.trim())) {
                  setEmailError('Please enter a valid email address.');
                } else {
                  setEmailError('');
                }
              }}
              className={`w-full px-4 py-3 border ${
                emailError ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500`}
              required
            />
            {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
          </div>

          {/* Username */}
          <div>
            <input
              type="text"
              placeholder="Username (optional)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={() => {
                if (username && !validateUsername(username.trim())) {
                  setUsernameError('Username must be 3–20 characters (letters, numbers, underscores only).');
                } else {
                  setUsernameError('');
                }
              }}
              className={`w-full px-4 py-3 border ${
                usernameError ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500`}
            />
            {usernameError && <p className="text-red-500 text-sm mt-1">{usernameError}</p>}
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (!validatePassword(e.target.value)) {
                  setPasswordError(
                    'Password must be 8+ chars, with uppercase, lowercase, number, and special character.'
                  );
                } else {
                  setPasswordError('');
                }
              }}
              className={`w-full px-4 py-3 border ${
                passwordError ? 'border-red-500' : 'border-gray-300'
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500`}
              required
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 cursor-pointer text-gray-500"
            >
              {showPassword ? <AiFillEyeInvisible size={22} /> : <AiFillEye size={22} />}
            </span>
            {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
          </div>

          {/* Captcha */}
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
              <button
                type="button"
                onClick={generateCaptcha}
                className="p-3 text-gray-600 hover:text-orange-500"
              >
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
            {captchaError && <p className="text-red-500 text-sm mt-1">{captchaError}</p>}
          </div>

          {/* Forgot password */}
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-orange-600 hover:text-orange-800"
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={!isFormValid || loading}
            className={`w-full font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
              ${loading || !isFormValid
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-orange-500 text-white hover:bg-orange-600'}`}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
