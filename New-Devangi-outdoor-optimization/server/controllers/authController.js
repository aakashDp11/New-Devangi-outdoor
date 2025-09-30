// controllers/authController.js

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/user.model.js';
import nodemailer from 'nodemailer';
import { generateTokens } from '../utils/token.js';

// --- NODEMAILER TRANSPORTER SETUP ---
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
});

// --- HELPER FOR SENDING REGISTRATION EMAIL ---
const sendConfirmationEmail = async ({ name, email, phone, password, role }) => {
  const mailOptions = {
    from: '"Devangi Outdoor solutions" <devangioutdoor@gmail.com>',
    to: email,
    subject: 'Welcome! Your Registration Details',
    html: `
      <h3>Welcome, ${name}!</h3>
      <p>You’ve successfully registered. Here are your credentials:</p>
      <ul>
        <li><strong>Role:</strong> ${role}</li>
        <li><strong>Name:</strong> ${name}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Phone:</strong> ${phone}</li>
        <li><strong>Password:</strong> ${password} (This is the plain password, consider not sending it for security)</li>
      </ul>
      <p>Keep this email safe.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Registration email sent to ${email}`);
  } catch (err) {
    console.error(`❌ Failed to send registration email:`, err);
    // For registration, we can let it fail silently as the user is already created.
  }
};

// --- HELPER FOR SENDING OTP EMAIL (CORRECTED) ---
const sendOtpEmail = async ({ email, otp }) => {
    const mailOptions = {
      from: '"Devangi Outdoor solutions" <devangioutdoor@gmail.com>',
      to: email,
      subject: 'Your Password Reset OTP',
      html: `
        <h3>Password Reset Request</h3>
        <p>You requested a password reset. Use the following One-Time Password (OTP) to proceed.</p>
        <p>Your OTP is: <strong>${otp}</strong></p>
        <p>This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
      `,
    };
  
    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ OTP email sent to ${email}`);
    } catch (err) {
      console.error(`❌ Failed to send OTP email:`, err);
      // THIS IS THE FIX: We throw an error to stop the process and inform the main controller.
      throw new Error('Email could not be sent. Check SMTP credentials and configuration.');
    }
};


// --- EXISTING CONTROLLERS ---
export const registerUser = async (req, res) => {
  const { name, email, phone, password } = req.body;
  const role = req.body.role || 'member';

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    if (role === 'admin') {
      const existingAdmin = await User.findOne({ role: 'admin' });
      if (existingAdmin) {
        return res.status(400).json({ message: 'Admin account already exists' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, phone, password: hashedPassword, role });

    await newUser.save();
    await sendConfirmationEmail({ name, email, phone, password, role });

    res.json({ message: `${role} registered successfully` });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const { accessToken, refreshToken } = generateTokens(user);

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ accessToken, user: { email: user.email, role: user.role, id: user._id, name: user.name } });
};


// --- NEW CONTROLLERS FOR PASSWORD RESET (CORRECTED) ---

/**
 * @description Generates an OTP, saves it to the user, and emails it.
 * @route POST /api/auth/send-reset-otp
 */
export const sendResetOtp = async (req, res) => {
    const { email } = req.body;
  
    try {
      const user = await User.findOne({ email });
  
      if (!user) {
        return res.status(200).json({ message: 'If an account with this email exists, an OTP has been sent.' });
      }
  
      const otp = crypto.randomInt(100000, 999999).toString();
      const expires = new Date(Date.now() + 10 * 60 * 1000);
  
      user.resetPasswordOtp = otp;
      user.resetPasswordExpires = expires;
      
      // THIS IS THE CRITICAL PART: We must wait for BOTH the email to send and the user to be saved.
      // If sendOtpEmail fails, the error will be caught by the `catch` block below.
      await sendOtpEmail({ email: user.email, otp });
      
      // Only save the user to the DB if the email was sent successfully.
      await user.save();
  
      res.status(200).json({ message: `An OTP has been sent to ${email}.` });
  
    } catch (error) {
      // THIS CATCH BLOCK NOW WORKS: It catches the error thrown from sendOtpEmail.
      console.error('Error in sendResetOtp controller:', error.message);
      // It sends a real error back to the frontend, preventing the success message.
      res.status(500).json({ message: 'Failed to send OTP. Please check server configuration.' });
    }
};

/**
 * @description Verifies the OTP and resets the user's password.
 * @route POST /api/auth/verify-otp-and-reset
 */
export const verifyOtpAndReset = async (req, res) => {
    const { email, otp, password } = req.body;
  
    try {
      const user = await User.findOne({
        email,
        resetPasswordOtp: otp,
        resetPasswordExpires: { $gt: Date.now() },
      });
  
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired OTP. Please try again.' });
      }
  
      user.password = await bcrypt.hash(password, 10);
      user.resetPasswordOtp = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
  
      res.status(200).json({ message: 'Password has been reset successfully.' });
  
    } catch (error) {
      console.error('Error in verifyOtpAndReset:', error);
      res.status(500).json({ message: 'Server error while resetting password.' });
    }
};