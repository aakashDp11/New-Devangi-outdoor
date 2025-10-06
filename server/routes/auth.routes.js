// routes/auth.routes.js

import express from 'express';
import jwt from 'jsonwebtoken'; // Assuming you have this for refresh-token
import {
  registerUser,
  loginUser,
  sendResetOtp,        // <-- Import new controller
  verifyOtpAndReset    // <-- Import new controller
} from '../controllers/authController.js';

const router = express.Router();
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET; // Make sure these are in your .env
const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET;


router.post('/register', registerUser);
router.post('/login', loginUser);

// --- ADD THE NEW PASSWORD RESET ROUTES HERE ---
router.post('/send-reset-otp', sendResetOtp);
router.post('/verify-otp-and-reset', verifyOtpAndReset);
// ---------------------------------------------

router.post('/refresh-token', (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(401).json({ message: 'No refresh token' });

  try {
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
    const accessToken = jwt.sign({
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    }, ACCESS_SECRET, { expiresIn: '15m' });

    res.json({ accessToken });
  } catch (err) {
    return res.status(403).json({ message: 'Invalid refresh token' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
});


export default router;