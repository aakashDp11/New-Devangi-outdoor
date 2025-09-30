import React from "react";
import { motion } from "framer-motion";
import { FaBullhorn } from "react-icons/fa";

const NotificationCard = ({ notification, onMarkRead, onDelete }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      whileHover={{ scale: 1.01 }}
      className={`p-4 rounded-2xl shadow mb-3 cursor-pointer transition-colors ${
        notification.read
          ? "bg-gray-100 bg-opacity-80 border-l-4 border-gray-200"
          : "bg-white border-l-4 border-[black] shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3">
        <FaBullhorn className="text-[black] mt-1" size={20} />
        <div className="flex-1">
          <h4 className="font-semibold text-[var(--color-text)]">
            {notification.title}
          </h4>
          <p className="text-sm text-[var(--color-muted)]">
            {notification.message}
          </p>
          <p className="text-xs text-[var(--color-muted)] mt-1">
            {new Date(notification.date).toLocaleString()}
          </p>
          <div className="mt-2 flex gap-2">
            {!notification.read && (
              <button
                onClick={() => onMarkRead(notification.id)}
                className="text-xs text-green-600 hover:text-green-800 transition-colors"
              >
                Mark as Read
              </button>
            )}
            <button
              onClick={() => onDelete(notification.id)}
              className="text-xs text-red-600 hover:text-red-800 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NotificationCard;