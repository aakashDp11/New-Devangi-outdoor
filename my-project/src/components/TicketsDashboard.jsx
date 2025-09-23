// components/TicketsDashboard.jsx

import React, { useState, useEffect } from 'react';
import { ticketService } from '../services/ticketService';
import { useAuth } from '../context/AuthContext';
import CreateTicketForm from './CreateTicketForm';
import TicketDetailsModal from './TicketDetailsModal';
import EmailTicketForm from './EmailTicketForm';
import EditTicketModal from './EditTicketModal';
// components/TicketsDashboard.jsx
import {
  FaPlus,
  FaEye,
  FaFilter,
  FaSearch,
  FaExclamationCircle,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaEdit,
  FaTrashAlt,
  FaReply // New import
} from 'react-icons/fa';

const TicketsDashboard = () => {
  const { auth, loading: authLoading } = useAuth();
  
  // Create user object from auth for compatibility
  const user = auth ? {
    id: auth.userId,
    email: localStorage.getItem('userEmail') || auth.userName, // Try userEmail first, fallback to userName
    role: auth.role,
    name: auth.userName
  } : null;
  
  // Debug auth state
  console.log('=== AUTH DEBUG ===');
  console.log('Auth object:', auth);
  console.log('User object (created):', user);
  console.log('Auth loading:', authLoading);
  console.log('User email:', user?.email);
  console.log('User role:', user?.role);
  console.log('==================');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [editTicket, setEditTicket] = useState(null);
  const [replyTicket, setReplyTicket] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [stats, setStats] = useState(null);

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

  const statusIcons = {
    open: <FaExclamationCircle className="text-green-600" />,
    'in-progress': <FaClock className="text-yellow-600" />,
    resolved: <FaCheckCircle className="text-blue-600" />,
    closed: <FaTimesCircle className="text-gray-600" />
  };

  useEffect(() => {
    console.log('useEffect triggered - fetching tickets and stats');
    console.log('User:', user);
    console.log('Pagination:', pagination);
    console.log('Filters:', filters);
    
    // Only fetch if we have a user (avoid infinite loop)
    if (user) {
      fetchTickets();
      if (user?.role === 'admin') {
        fetchStats();
      }
    }
  }, [pagination.page, filters, user?.id, user?.role]); // ← Fixed: Use stable user properties

  const fetchTickets = async () => {
    try {
      console.log('fetchTickets - Starting...');
      console.log('fetchTickets - Auth token:', auth?.token);
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };

      console.log('fetchTickets - Request params:', params);
      console.log('fetchTickets - User role:', user?.role);
      console.log('fetchTickets - API call starting...');

      const response = user?.role === 'admin'
        ? await ticketService.getAllTickets(params)
        : await ticketService.getUserTickets(params);

      console.log('fetchTickets - Response received:', response);
      console.log('fetchTickets - Tickets data:', response.tickets);

      // Debug each ticket's createdBy field
      response.tickets.forEach((ticket, index) => {
        console.log(`Ticket ${index} (${ticket.ticketId}):`, {
          id: ticket._id,
          createdBy: ticket.createdBy,
          createdByEmail: ticket.createdBy?.email,
          receiverEmail: ticket.receiverEmail
        });
      });

      setTickets(response.tickets);
      setPagination(prev => ({
        ...prev,
        total: response.total,
        totalPages: response.totalPages
      }));
      
      console.log('fetchTickets - State updated successfully');
      console.log('fetchTickets - Tickets count:', response.tickets?.length);
      console.log('fetchTickets - Loading state about to be set to false');
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
      console.log('fetchTickets - Loading set to false');
    }
  };

  const fetchStats = async () => {
    try {
      console.log('fetchStats - Starting...');
      const response = await ticketService.getTicketStats();
      console.log('fetchStats - Response:', response);
      setStats(response);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    console.log('handleFilterChange - Key:', key, 'Value:', value);
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleTicketCreated = (newTicket) => {
    console.log('handleTicketCreated - New ticket:', newTicket);
    setShowCreateForm(false);
    fetchTickets();
    alert(`Support ticket ${newTicket.ticket?.ticketId} created successfully!`);
  };

  const handleViewTicket = async (ticketId) => {
    try {
      console.log('handleViewTicket - Ticket ID:', ticketId);
      const ticket = await ticketService.getTicketById(ticketId);
      console.log('handleViewTicket - Ticket details:', ticket);
      setSelectedTicket(ticket);
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      alert('Failed to load ticket details');
    }
  };

  const handleEditTicket = (ticket) => {
    console.log('handleEditTicket - Ticket:', ticket);
    setEditTicket(ticket);
  };
  
  const handleDeleteTicket = async (ticketId) => {
    console.log('handleDeleteTicket - Ticket ID:', ticketId);
    if (window.confirm(`Are you sure you want to delete ticket ${ticketId}? This action cannot be undone.`)) {
      try {
        await ticketService.deleteTicket(ticketId);
        console.log('handleDeleteTicket - Ticket deleted successfully');
        alert(`Ticket ${ticketId} deleted successfully!`);
        fetchTickets();
      } catch (error) {
        console.error('Error deleting ticket:', error);
        alert('Failed to delete ticket. Please try again.');
      }
    } else {
      console.log('handleDeleteTicket - User cancelled deletion');
    }
  };
  
  const handleTicketUpdated = () => {
    console.log('handleTicketUpdated - Ticket updated, refreshing list');
    setEditTicket(null);
    fetchTickets();
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

  const handleEmailSent = (response) => {
    console.log('handleEmailSent - Response:', response);
    setShowEmailForm(false);
    setReplyTicket(null);
    fetchTickets();
    alert('Email sent successfully!');
  };

  const handleReplyTicket = (ticket) => {
    console.log('=== REPLY BUTTON CLICKED ===');
    console.log('handleReplyTicket - Full ticket object:', ticket);
    console.log('handleReplyTicket - Ticket ID:', ticket.ticketId);
    console.log('handleReplyTicket - CreatedBy field:', ticket.createdBy);
    console.log('handleReplyTicket - CreatedBy email (original sender):', ticket.createdBy?.email);
    console.log('handleReplyTicket - ReceiverEmail (original receiver):', ticket.receiverEmail);
    console.log('handleReplyTicket - Current user:', user);
    console.log('handleReplyTicket - Current user email:', user?.email);

    // Check if the ticket has the required data
    if (!ticket.createdBy) {
      console.error('handleReplyTicket - ERROR: ticket.createdBy is null/undefined');
      alert('Cannot reply: Ticket creator information not found');
      return;
    }

    if (!ticket.createdBy.email) {
      console.error('handleReplyTicket - ERROR: ticket.createdBy.email is null/undefined');
      console.log('handleReplyTicket - CreatedBy object structure:', Object.keys(ticket.createdBy || {}));
      alert('Cannot reply: Ticket creator email not found');
      return;
    }

    if (!ticket.receiverEmail) {
      console.error('handleReplyTicket - ERROR: ticket.receiverEmail is null/undefined');
      alert('Cannot reply: Original receiver email not found');
      return;
    }

    if (!user || !user.email) {
      console.error('handleReplyTicket - ERROR: Current user or user email is null/undefined');
      console.log('handleReplyTicket - Auth context user object:', user);
      alert('Cannot reply: Please make sure you are logged in. Current user information not available.');
      return;
    }

    // Always swap sender/receiver roles in reply
    // Original: createdBy.email → receiverEmail
    // Reply:    receiverEmail → createdBy.email
    
    const replySender = ticket.receiverEmail;        // Original receiver becomes sender
    const replyReceiver = ticket.createdBy.email;    // Original sender becomes receiver

    console.log('handleReplyTicket - Reply logic (always swap roles):');
    console.log('  - Original sender:', ticket.createdBy.email);
    console.log('  - Original receiver:', ticket.receiverEmail);
    console.log('  - Reply sender (swapped):', replySender);
    console.log('  - Reply receiver (swapped):', replyReceiver);

    const initialData = {
      senderEmail: replySender,
      receiverEmail: replyReceiver,
      subject: `Re: Ticket ${ticket.ticketId} - ${ticket.subject}`,
      description: '',
      category: ticket.category,
      priority: ticket.priority,
    };
    
    console.log('handleReplyTicket - Initial data prepared:', initialData);
    console.log('handleReplyTicket - Setting replyTicket state...');
    
    setReplyTicket(initialData);
    
    console.log('handleReplyTicket - Setting showEmailForm to true...');
    setShowEmailForm(true);
    
    console.log('handleReplyTicket - Function completed');
    console.log('=== END REPLY BUTTON HANDLER ===');
  };

  // Debug state changes
  useEffect(() => {
    console.log('State change - replyTicket:', replyTicket);
  }, [replyTicket]);

  useEffect(() => {
    console.log('State change - showEmailForm:', showEmailForm);
  }, [showEmailForm]);

  if (showCreateForm) {
    console.log('Rendering CreateTicketForm');
    return (
      <CreateTicketForm
        onTicketCreated={handleTicketCreated}
        onCancel={() => setShowCreateForm(false)}
      />
    );
  }

  if (showEmailForm) {
    console.log('Rendering EmailTicketForm');
    console.log('EmailTicketForm - replyTicket data:', replyTicket);
    
    const initialData = replyTicket ? replyTicket : {};
    console.log('EmailTicketForm - initialData:', initialData);

    return (
      <EmailTicketForm
        initialData={initialData}
        onEmailSent={handleEmailSent}
        onCancel={() => {
          console.log('EmailTicketForm - Cancel clicked');
          setShowEmailForm(false);
          setReplyTicket(null);
        }}
      />
    );
  }

  if (showOptions) {
    console.log('Rendering Options screen');
    return (
      <div className="max-w-xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Choose an Option</h2>
        <div className="flex flex-col space-y-4">
          <button
            onClick={() => {
              console.log('Options - Form option clicked');
              setShowOptions(false);
              setShowCreateForm(true);
            }}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Raise Ticket via Form
          </button>
          <button
            onClick={() => {
              console.log('Options - Email option clicked');
              setShowOptions(false);
              setShowEmailForm(true);
            }}
            className="w-full px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            Raise Ticket via Email
          </button>
          <button
            onClick={() => {
              console.log('Options - Cancel clicked');
              setShowOptions(false);
            }}
            className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Add loading check for authentication
  if (authLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="ml-4 text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  // Check if user is logged in
  if (!user) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>Please log in to access the support tickets dashboard.</p>
          <button 
            onClick={() => window.location.href = '/login'} 
            className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  console.log('Rendering main dashboard');
  console.log('Dashboard - Current state:', {
    tickets: tickets.length,
    loading,
    showCreateForm,
    showEmailForm,
    showOptions,
    selectedTicket: !!selectedTicket,
    editTicket: !!editTicket,
    replyTicket: !!replyTicket
  });
  console.log('Dashboard - Loading state check:', loading, typeof loading);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Support Tickets</h1>
        <button
          onClick={() => {
            console.log('New Ticket button clicked');
            setShowOptions(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <FaPlus />
          <span>New Ticket</span>
        </button>
      </div>

      {user?.role === 'admin' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Tickets</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.overview.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Open</h3>
            <p className="text-2xl font-bold text-green-600">{stats.overview.open}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">In Progress</h3>
            <p className="text-2xl font-bold text-yellow-600">{stats.overview.inProgress}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Resolved</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.overview.resolved}</p>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search tickets..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="technical">Technical</option>
              <option value="billing">Billing</option>
              <option value="general">General</option>
              <option value="feature-request">Feature Request</option>
              <option value="bug-report">Bug Report</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No tickets found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sender
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receiver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tickets.map((ticket) => {
                  console.log('Rendering ticket row:', ticket.ticketId, 'CreatedBy:', ticket.createdBy);
                  return (
                    <tr key={ticket._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {ticket.ticketId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ticket.createdBy?.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ticket.receiverEmail || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate">{ticket.subject}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {statusIcons[ticket.status]}
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusColors[ticket.status]}`}>
                            {ticket.status.replace('-', ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${priorityColors[ticket.priority]}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {ticket.category.replace('-', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(ticket.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex space-x-2">
                        <button
                          onClick={() => {
                            console.log('View button clicked for ticket:', ticket.ticketId);
                            handleViewTicket(ticket.ticketId);
                          }}
                          className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                        >
                          <FaEye />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => {
                            console.log('Edit button clicked for ticket:', ticket.ticketId);
                            handleEditTicket(ticket);
                          }}
                          className="text-gray-600 hover:text-gray-800 flex items-center space-x-1"
                        >
                          <FaEdit />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => {
                            console.log('Delete button clicked for ticket:', ticket.ticketId);
                            handleDeleteTicket(ticket.ticketId);
                          }}
                          className="text-red-600 hover:text-red-800 flex items-center space-x-1"
                        >
                          <FaTrashAlt />
                          <span>Delete</span>
                        </button>
                        <button
                          onClick={() => {
                            console.log('Reply button clicked for ticket:', ticket.ticketId);
                            handleReplyTicket(ticket);
                          }}
                          className="text-green-600 hover:text-green-800 flex items-center space-x-1"
                        >
                          <FaReply />
                          <span>Reply</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setPagination(prev => ({ ...prev, page }))}
                className={`px-4 py-2 border rounded-md ${
                  pagination.page === page
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {selectedTicket && (
        <TicketDetailsModal
          ticket={selectedTicket}
          onClose={() => {
            console.log('TicketDetailsModal - Close clicked');
            setSelectedTicket(null);
          }}
          onUpdate={fetchTickets}
          userRole={user?.role}
        />
      )}
      {editTicket && (
        <EditTicketModal
          ticket={editTicket}
          onClose={() => {
            console.log('EditTicketModal - Close clicked');
            setEditTicket(null);
          }}
          onUpdate={handleTicketUpdated}
        />
      )}
    </div>
  );
};

export default TicketsDashboard;