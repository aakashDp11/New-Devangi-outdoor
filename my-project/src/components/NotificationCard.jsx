// components/NotificationCard.jsx
import React from 'react';

const NotificationCard = ({ notification, onMarkRead, onDelete }) => {
  return (
    <div className={`p-4 rounded shadow mb-3 ${notification.read ? 'bg-gray-100' : 'bg-white border-l-4 border-blue-500'}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-700">{notification.message}</p>
          <p className="text-xs text-gray-400 mt-1">{new Date(notification.createdAt).toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
          {!notification.read && (
            <button onClick={() => onMarkRead(notification._id)} className="text-blue-500 text-xs hover:underline">Mark as read</button>
          )}
          <button onClick={() => onDelete(notification._id)} className="text-red-500 text-xs hover:underline">Delete</button>
        </div>
      </div>
    </div>
  );
};

export default NotificationCard;
