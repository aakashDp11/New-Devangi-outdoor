import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import logo1 from "../assets/d3.png";

function ForgotPassword() {
  const navigate = useNavigate();

  // Form fields state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handler for resetting the password directly
  const handleResetPassword = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // THIS IS THE INSECURE API CALL
      // It trusts that the person filling out the form is the legitimate user.
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/force-reset-password`,
        {
          email,
          password,
        }
      );

      toast.success("Your password has been reset successfully!");
      navigate("/login"); // Redirect to login on success
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "Failed to reset password. Please check the email address.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
        <img className="w-40 mx-auto mb-6" src={logo1} alt="Company Logo" />

        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Reset Password
        </h2>
        <p className="text-center text-gray-500 mb-8">
          Enter your email and new password.
        </p>

        <form onSubmit={handleResetPassword} className="space-y-5">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white font-bold py-3 px-4 rounded-lg transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:bg-orange-300"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        {error && (
          <p className="text-red-500 text-sm text-center mt-4">{error}</p>
        )}

        <p className="text-center text-sm text-gray-600 mt-8">
          Remembered your password?{" "}
          <Link
            to="/login"
            className="font-medium text-orange-600 hover:text-orange-800"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
