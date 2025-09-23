// components/TicketDetailsModal.jsx

import React, { useState, useRef, useEffect } from 'react';
import { ticketService } from '../services/ticketService';
import { 
  FaTimes, 
  FaPaperPlane, 
  FaDownload, 
  FaUser,
  FaUserTie,
  FaClock,
  FaSpinner
} from 'react-icons/fa';

const TicketDetailsModal = ({ ticket, onClose, onUpdate, userRole }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    status: ticket.status,
    resolution: ticket.resolution || ''
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const messagesEndRef = useRef(null);

  const statusColors = {
    open: 'bg-green-100 text-green-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-blue-100 text-blue-800',
    closed: 'bg-gray-100 text-gray-800'
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  useEffect(() => {
    scrollToBottom();
  }, [ticket.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    try {
      // Send the message to the backend
      await ticketService.addTicketMessage(ticket.ticketId, newMessage, isInternal);
      setNewMessage('');
      setIsInternal(false);
      onUpdate(); // Refresh the ticket data
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (statusUpdate.status === ticket.status && statusUpdate.resolution === ticket.resolution) {
      return;
    }

    setUpdatingStatus(true);
    try {
      await ticketService.updateTicketStatus(
        ticket.ticketId, 
        statusUpdate.status, 
        statusUpdate.resolution
      );
      onUpdate(); // Refresh the ticket data
      alert('Ticket status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update ticket status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const downloadAttachment = (attachment) => {
    const link = document.createElement('a');
    link.href = `/api/tickets/attachments/${attachment.filename}`;
    link.download = attachment.originalName;
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Ticket {ticket.ticketId}
            </h2>
            <p className="text-gray-600 mt-1">{ticket.subject}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Ticket Info */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div className="mt-1">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${statusColors[ticket.status]}`}>
                  {ticket.status.replace('-', ' ')}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Priority</label>
              <div className="mt-1">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${priorityColors[ticket.priority]}`}>
                  {ticket.priority}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Category</label>
              <p className="mt-1 text-sm text-gray-900 capitalize">
                {ticket.category.replace('-', ' ')}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Created</label>
              <p className="mt-1 text-sm text-gray-900">
                {formatDate(ticket.createdAt)}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium text-gray-500">Created by</label>
            <p className="mt-1 text-sm text-gray-900">
              {ticket.createdBy.name} ({ticket.createdBy.email})
            </p>
          </div>

          {ticket.assignedTo && (
            <div className="mt-2">
              <label className="text-sm font-medium text-gray-500">Assigned to</label>
              <p className="mt-1 text-sm text-gray-900">
                {ticket.assignedTo.name} ({ticket.assignedTo.email})
              </p>
            </div>
          )}

          {ticket.resolution && (
            <div className="mt-4">
              <label className="text-sm font-medium text-gray-500">Resolution</label>
              <p className="mt-1 text-sm text-gray-900 bg-white p-3 rounded border">
                {ticket.resolution}
              </p>
            </div>
          )}
        </div>

        {/* Attachments */}
        {ticket.attachments && ticket.attachments.length > 0 && (
          <div className="p-6 border-b bg-gray-50">
            <label className="text-sm font-medium text-gray-500 mb-2 block">Attachments</label>
            <div className="space-y-2">
              {ticket.attachments.map((attachment, index) => (
                <div key={index} className="flex items-center justify-between bg-white p-3 rounded border">
                  <div className="flex items-center space-x-3">
                    <div className="text-gray-400">
                      📎
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {attachment.originalName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(attachment.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadAttachment(attachment)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FaDownload />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {ticket.messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.sender._id === ticket.createdBy._id ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender._id === ticket.createdBy._id
                    ? 'bg-blue-600 text-white'
                    : message.isInternal
                    ? 'bg-yellow-100 text-yellow-800 border-l-4 border-yellow-400'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <div className="flex items-center space-x-2 mb-1">
                    {message.sender.role === 'admin' ? <FaUserTie size={12} /> : <FaUser size={12} />}
                    <span className="text-xs font-medium">
                      {message.sender.name}
                    </span>
                    {message.isInternal && (
                      <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                        Internal
                      </span>
                    )}
                  </div>
                  <p className="text-sm">{message.message}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <FaClock size={10} />
                    <span className="text-xs opacity-75">
                      {formatDate(message.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Status Update (Admin Only) */}
        {userRole === 'admin' && (
          <div className="p-6 border-t bg-gray-50">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Update Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusUpdate.status}
                  onChange={(e) => setStatusUpdate(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleStatusUpdate}
                  disabled={updatingStatus}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {updatingStatus && <FaSpinner className="animate-spin" />}
                  <span>Update Status</span>
                </button>
              </div>
            </div>
            {statusUpdate.status === 'resolved' && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Resolution</label>
                <textarea
                  value={statusUpdate.resolution}
                  onChange={(e) => setStatusUpdate(prev => ({ ...prev, resolution: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe how this issue was resolved..."
                />
              </div>
            )}
          </div>
        )}

        {/* Message Input */}
        <div className="p-6 border-t">
          <form onSubmit={handleSendMessage}>
            <div className="flex flex-col space-y-3">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  {userRole === 'admin' && (
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={isInternal}
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">Internal note</span>
                    </label>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={loading || !newMessage.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading && <FaSpinner className="animate-spin" />}
                  <FaPaperPlane />
                  <span>Send</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TicketDetailsModal;