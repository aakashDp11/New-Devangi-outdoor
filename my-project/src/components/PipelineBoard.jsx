import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast } from "sonner";
import { FaCheck, FaExclamationTriangle, FaTimes, FaUpload } from "react-icons/fa";
import { FaPoundSign } from "react-icons/fa6";

// Assuming these reusable components are available
const Card = ({ children, className = "" }) => (
  <div
    className={`bg-gray-100 bg-opacity-80 shadow-xl rounded-2xl w-full flex flex-col relative overflow-hidden transition-all hover:shadow-2xl ${className}`}
  >
    <div className="absolute inset-0 bg-gradient-to-br from-white via-indigo-50 to-purple-50 opacity-20 animate-bg-gradient-flow-diagonal z-0"></div>
    <div className="relative z-10 h-full flex flex-col">{children}</div>
  </div>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`p-4 md:p-6 flex-grow flex flex-col ${className}`}>
    {children}
  </div>
);

const Button = ({ children, className = "", disabled = false, loading = false, ...props }) => (
  <button
    className={`px-4 py-2 rounded-xl bg-[black] text-white text-xs font-medium transition-all duration-200 transform hover:scale-105 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md hover:shadow-lg ${className}`}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? (
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        {children}
      </div>
    ) : (
      children
    )}
  </button>
);

const Input = ({ className = "", error = null, ...props }) => (
  <div className="relative">
    <input
      className={`border ${
        error ? "border-red-300" : "border-gray-200"
      } px-4 py-2 rounded-xl w-full bg-white text-[var(--color-text)] focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md ${className}`}
      {...props}
    />
    {error && (
      <p className="absolute -bottom-5 left-0 text-red-500 text-xs mt-1 animate-slideDown">
        {error}
      </p>
    )}
  </div>
);

const Notification = ({ message, type = "success", onClose }) => {
  return (
    <div
      className={`px-4 py-3 rounded-lg shadow-lg animate-fadeIn ${
        type === "error" ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"
      }`}
    >
      <div className="flex items-center gap-2">
        {type === "error" ? <FaExclamationTriangle /> : <FaCheck />}
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-auto text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]"
        >
          &times;
        </button>
      </div>
    </div>
  );
};

// --- START REFACTORED COMPONENT ---
export default function PipelineBoard({ bookingId }) {
  const [pipeline, setPipeline] = useState({});
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [activeForm, setActiveForm] = useState(null);

  const steps = [
    'Booking Confirmed',
    'PO Received',
    'Raise Invoice',
    'Accept Payment',
    'Upload Artwork',
    'Printing Status',
    'Mounting Status',
    'Advertising Live',
    'Notify for Removal/Extension'
  ];

  const addNotification = useCallback((message, type = 'success') => {
    const notificationId = Date.now();
    const notification = { id: notificationId, message, type };
    setNotifications((prev) => [...prev, notification]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    }, 5000);
  }, []);

  const fetchPipeline = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/booking/${bookingId}/pipeline`);
      setPipeline(res.data);
    } catch (error) {
      addNotification('Failed to fetch pipeline data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPipeline();
  }, [bookingId]);

  const markStageDone = async (stage) => {
    try {
      await axios.post(`/api/booking/${bookingId}/pipeline/update`, {
        stage,
        data: {}
      });
      addNotification(`${stage} marked as done!`);
      fetchPipeline();
    } catch (error) {
      addNotification(`Failed to update ${stage}.`, 'error');
    }
  };

  if (loading) return <div className="text-center py-6">Loading...</div>;

  const renderForm = (step) => {
    switch (step) {
      case 'Accept Payment':
        return (
          <Card className="mt-4">
            <CardContent>
              <h3 className="text-lg font-semibold mb-4">Accept Payment</h3>
              {/* This is a placeholder for the actual form component */}
              <div className="p-4 border rounded-lg bg-white shadow-sm flex flex-col gap-2">
                <Input type="number" placeholder="Payment Amount" />
                <Button className="bg-blue-600 text-white">Submit Payment</Button>
              </div>
              <Button onClick={() => setActiveForm(null)} className="mt-4 bg-gray-200 text-gray-700">
                Cancel
              </Button>
            </CardContent>
          </Card>
        );
      case 'Upload Artwork':
        return (
          <Card className="mt-4">
            <CardContent>
              <h3 className="text-lg font-semibold mb-4">Upload Artwork</h3>
              {/* This is a placeholder for the actual form component */}
              <div className="p-4 border rounded-lg bg-white shadow-sm flex flex-col gap-2">
                <Input type="file" />
                <Button className="bg-blue-600 text-white">Upload</Button>
              </div>
              <Button onClick={() => setActiveForm(null)} className="mt-4 bg-gray-200 text-gray-700">
                Cancel
              </Button>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() => setNotifications((prev) => prev.filter((n) => n.id !== notification.id))}
          />
        ))}
      </div>
      {steps.map((step, index) => {
        const current = pipeline[step.toLowerCase().replace(/ /g, '')] || {};
        const isDone = current.status === 'done' || (current.confirmed);

        return (
          <Card key={index} className={`p-4 animate-slideUp`}>
            <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="font-medium text-[var(--color-text)] flex-grow text-left">{step}</span>
              <div className="flex gap-3 flex-shrink-0">
                {isDone ? (
                  <span className="text-green-700 font-semibold flex items-center gap-2">
                    <FaCheck /> Done
                  </span>
                ) : (
                  <>
                    {(step === 'Accept Payment' || step === 'Upload Artwork') ? (
                      <Button
                        onClick={() => setActiveForm(activeForm === step ? null : step)}
                        className={`
                          ${activeForm === step ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'}
                          text-white
                        `}
                      >
                        {activeForm === step ? <FaTimes /> : (step === 'Accept Payment' ? <FaPoundSign /> : <FaUpload />)}
                        {activeForm === step ? 'Cancel' : `Input Data`}
                      </Button>
                    ) : (
                      <Button onClick={() => markStageDone(step)} className="bg-blue-600 text-white hover:bg-blue-700">
                        Mark as Done
                      </Button>
                    )}
                  </>
                )}
              </div>
            </CardContent>
            {activeForm === step && renderForm(step)}
          </Card>
        );
      })}
      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes bg-gradient-flow-diagonal { 0% { background-position: 0% 0%; } 100% { background-position: 100% 100%; } }
        .animate-bg-gradient-flow-diagonal { background-size: 200% 200%; animation: bg-gradient-flow-diagonal 10s linear infinite; }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.4s ease-out; }
        .animate-slideDown { animation: slideDown 0.4s ease-out; }
        .animate-slideIn { animation: slideIn 0.4s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}