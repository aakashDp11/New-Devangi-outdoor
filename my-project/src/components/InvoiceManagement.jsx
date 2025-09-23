import React, { useState, useEffect } from 'react';
import { 
    FileText, 
    Plus, 
    Search, 
    Download, 
    Eye, 
    Edit, 
    Trash2, 
    DollarSign, 
    BarChart3,
    TrendingUp,
    Clock,
    CheckCircle,
    AlertCircle,
    XCircle,
    Calendar,
    ChevronDown,
    Loader2
} from 'lucide-react';

// Custom, self-contained modal component
const DialogComponent = ({ open, onOpenChange, title, children, actions }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="w-[90vw] max-w-[500px] bg-white rounded-lg p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button 
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="py-4">{children}</div>
        <div className="flex justify-end space-x-2">
          {actions}
        </div>
      </div>
    </div>
  );
};

const API_BASE_URL = 'http://localhost:3000/api'; 

// Utility function to make a robust fetch call with retry
const fetchWithRetry = async (url, options = {}, retries = 3) => {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        if (retries > 0) {
            console.warn(`Fetch failed, retrying... (${retries} retries left)`);
            await new Promise(res => setTimeout(res, 1000 * (4 - retries)));
            return fetchWithRetry(url, options, retries - 1);
        }
        console.error("All fetch retries failed:", error);
        throw error;
    }
};

const InvoiceManagement = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState({ totalBilled: 0, totalCollected: 0, outstanding: 0, totalInvoices: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);

    // Fetch dashboard stats on initial load
    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [
                    outstandingResponse,
                    monthlySummaryResponse
                ] = await Promise.all([
                    fetchWithRetry(`${API_BASE_URL}/reports/outstanding`),
                    fetchWithRetry(`${API_BASE_URL}/reports/monthly-summary`)
                ]);

                const totalBilled = monthlySummaryResponse.reduce((sum, item) => sum + item.totalBilled, 0);
                const totalCollected = monthlySummaryResponse.reduce((sum, item) => sum + item.totalPaid, 0);
                const totalInvoicesCount = monthlySummaryResponse.reduce((sum, item) => sum + item.invoiceCount, 0);
                const totalOutstanding = outstandingResponse.reduce((sum, item) => sum + item.balanceDue, 0);

                setStats({
                    totalBilled,
                    totalCollected,
                    outstanding: totalOutstanding,
                    totalInvoices: totalInvoicesCount
                });
            } catch (err) {
                console.error('Failed to fetch dashboard data', err);
                setError('Failed to load dashboard data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        if (activeTab === 'dashboard') {
            fetchDashboardData();
        }
    }, [activeTab]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-800';
            case 'partial': return 'bg-yellow-100 text-yellow-800';
            case 'issued': return 'bg-blue-100 text-blue-800';
            case 'overdue': return 'bg-red-100 text-red-800';
            case 'draft': return 'bg-gray-200 text-gray-800';
            case 'cancelled': return 'bg-red-200 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'paid': return <CheckCircle className="w-4 h-4" />;
            case 'partial': return <AlertCircle className="w-4 h-4" />;
            case 'issued': return <Clock className="w-4 h-4" />;
            case 'overdue': return <XCircle className="w-4 h-4" />;
            case 'draft': return <FileText className="w-4 h-4" />;
            case 'cancelled': return <XCircle className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    const Dashboard = () => {
        const [recentInvoices, setRecentInvoices] = useState([]);
        const [recentLoading, setRecentLoading] = useState(true);

        useEffect(() => {
            const fetchRecentInvoices = async () => {
                setRecentLoading(true);
                try {
                    const data = await fetchWithRetry(`${API_BASE_URL}/invoices?sort=-createdAt&limit=5`);
                    setRecentInvoices(data);
                } catch (err) {
                    console.error('Failed to fetch recent invoices', err);
                } finally {
                    setRecentLoading(false);
                }
            };
            fetchRecentInvoices();
        }, []);

        return (
            <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Billed</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalBilled)}</p>
                            </div>
                            <div className="bg-blue-50 p-3 rounded-lg">
                                <DollarSign className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Collected</p>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalCollected)}</p>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Outstanding</p>
                                <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.outstanding)}</p>
                            </div>
                            <div className="bg-orange-50 p-3 rounded-lg">
                                <Clock className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 mb-1">Total Invoices</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalInvoices}</p>
                            </div>
                            <div className="bg-purple-50 p-3 rounded-lg">
                                <FileText className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>
                {/* Recent Invoices */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
                            <button
                                onClick={() => setActiveTab('invoices')}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                                View All
                            </button>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {recentLoading ? (
                                <div className="text-center text-gray-500">
                                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                    <span>Loading recent invoices...</span>
                                </div>
                            ) : recentInvoices.length > 0 ? (
                                recentInvoices.map((invoice) => (
                                    <div key={invoice._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div className="flex items-center space-x-4">
                                            <div className="bg-blue-100 p-2 rounded-lg">
                                                <FileText className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                                                <p className="text-sm text-gray-600">{invoice.clientId?.name || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">{formatCurrency(invoice.totalAmount)}</p>
                                            <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                                                {getStatusIcon(invoice.status)}
                                                <span className="capitalize">{invoice.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500">No recent invoices found.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const InvoiceList = () => {
        const [allInvoices, setAllInvoices] = useState([]);
        const [listLoading, setListLoading] = useState(false);
        const [filters, setFilters] = useState({ status: '', clientId: '', dateRange: '' });

        const fetchAllInvoices = async () => {
            setListLoading(true);
            try {
                const queryParams = new URLSearchParams();
                if (filters.status) queryParams.append('status', filters.status);
                if (filters.clientId) queryParams.append('clientId', filters.clientId);
                if (filters.dateRange) {
                    const [startDate, endDate] = filters.dateRange.split('|');
                    queryParams.append('startDate', startDate);
                    queryParams.append('endDate', endDate);
                }
                const url = `${API_BASE_URL}/invoices?${queryParams.toString()}`;
                const data = await fetchWithRetry(url);
                setAllInvoices(data);
            } catch (err) {
                console.error('Failed to fetch all invoices', err);
            } finally {
                setListLoading(false);
            }
        };

        useEffect(() => {
            fetchAllInvoices();
        }, [filters]);

        const handleDelete = async (invoiceId) => {
            try {
                await fetchWithRetry(`${API_BASE_URL}/invoices/${invoiceId}`, { method: 'DELETE' });
                // Optimistically update the UI
                setAllInvoices(allInvoices.filter(inv => inv._id !== invoiceId));
            } catch (err) {
                console.error('Failed to delete invoice', err);
            }
        };

        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
                        <p className="text-gray-600">Manage your invoices and payments</p>
                    </div>
                    <button
                        onClick={() => setShowInvoiceModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create Invoice</span>
                    </button>
                </div>
                {/* Filters */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex flex-wrap items-center space-x-4 space-y-2">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search invoices..."
                                className="pl-9 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <select
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        >
                            <option value="">All Status</option>
                            <option value="draft">Draft</option>
                            <option value="issued">Issued</option>
                            <option value="paid">Paid</option>
                            <option value="partial">Partial</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <input
                            type="date"
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                            onChange={(e) => {
                                const date = new Date(e.target.value);
                                const nextDay = new Date(date);
                                nextDay.setDate(date.getDate() + 1);
                                setFilters({ 
                                    ...filters, 
                                    dateRange: `${date.toISOString()}|${nextDay.toISOString()}` 
                                });
                            }}
                        />
                    </div>
                </div>
                {/* Invoice Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="text-left p-4 font-medium text-gray-900">Invoice</th>
                                    <th className="text-left p-4 font-medium text-gray-900">Client</th>
                                    <th className="text-left p-4 font-medium text-gray-900">Date</th>
                                    <th className="text-left p-4 font-medium text-gray-900">Amount</th>
                                    <th className="text-left p-4 font-medium text-gray-900">Status</th>
                                    <th className="text-left p-4 font-medium text-gray-900">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {listLoading ? (
                                    <tr><td colSpan="6" className="p-4 text-center">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                        <span className="block mt-2">Loading invoices...</span>
                                    </td></tr>
                                ) : (
                                    allInvoices.length > 0 ? (
                                        allInvoices.map((invoice) => (
                                            <tr key={invoice._id} className="hover:bg-gray-50">
                                                <td className="p-4">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                                                        <p className="text-sm text-gray-600">Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div>
                                                        <p className="font-medium text-gray-900">{invoice.clientId?.name || 'N/A'}</p>
                                                        <p className="text-sm text-gray-600">{invoice.clientId?.email || 'N/A'}</p>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-gray-900">
                                                    {new Date(invoice.invoiceDate).toLocaleDateString()}
                                                </td>
                                                <td className="p-4">
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{formatCurrency(invoice.totalAmount)}</p>
                                                        {invoice.balanceDue > 0 && (
                                                            <p className="text-sm text-red-600">Due: {formatCurrency(invoice.balanceDue)}</p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                                                        {getStatusIcon(invoice.status)}
                                                        <span className="capitalize">{invoice.status}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center space-x-2">
                                                        <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button className="p-2 text-gray-600 hover:text-gray-600 hover:bg-gray-50 rounded-lg">
                                                            <Download className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(invoice._id)}
                                                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="6" className="p-4 text-center">No invoices match the current filter.</td></tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const Reports = () => {
        const [reportsData, setReportsData] = useState({ outstanding: [], monthlySummary: [], gst: {}, aging: {} });
        const [reportsLoading, setReportsLoading] = useState(false);

        useEffect(() => {
            const fetchReports = async () => {
                setReportsLoading(true);
                try {
                    const [
                        outstandingResponse,
                        monthlySummaryResponse,
                        gstResponse,
                        agingResponse
                    ] = await Promise.all([
                        fetchWithRetry(`${API_BASE_URL}/reports/outstanding`),
                        fetchWithRetry(`${API_BASE_URL}/reports/monthly-summary`),
                        fetchWithRetry(`${API_BASE_URL}/reports/gst`),
                        fetchWithRetry(`${API_BASE_URL}/reports/aging`)
                    ]);
                    setReportsData({
                        outstanding: outstandingResponse,
                        monthlySummary: monthlySummaryResponse,
                        gst: gstResponse,
                        aging: agingResponse
                    });
                } catch (err) {
                    console.error('Failed to fetch reports', err);
                } finally {
                    setReportsLoading(false);
                }
            };
            if (activeTab === 'reports') {
                fetchReports();
            }
        }, [activeTab]);

        if (reportsLoading) return (
            <div className="p-8 text-center text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                <span className="block mt-2">Loading reports...</span>
            </div>
        );

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
                        <p className="text-gray-600">Financial insights and performance metrics</p>
                    </div>
                    <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2">
                        <Download className="w-4 h-4" />
                        <span>Export Reports</span>
                    </button>
                </div>
                {/* Outstanding Report */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900">Outstanding by Client</h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {reportsData.outstanding.length > 0 ? (
                                reportsData.outstanding.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div>
                                            <p className="font-medium text-gray-900">{item.client.name}</p>
                                            <p className="text-sm text-gray-600">Total Billed: {formatCurrency(item.totalBilled)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-red-600">{formatCurrency(item.balanceDue)}</p>
                                            <p className="text-sm text-gray-600">Outstanding</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500">No outstanding invoices found.</p>
                            )}
                        </div>
                    </div>
                </div>
                {/* Monthly Summary & GST Report */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">Monthly Summary</h3>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                {reportsData.monthlySummary.length > 0 ? (
                                    reportsData.monthlySummary.map((month, index) => (
                                        <div key={index} className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    {new Date(month._id.year, month._id.month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                </p>
                                                <p className="text-sm text-gray-600">{month.invoiceCount} invoices</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-gray-900">{formatCurrency(month.totalBilled)}</p>
                                                <p className="text-sm text-green-600">{formatCurrency(month.totalPaid)} collected</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-gray-500">No monthly summary data.</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-900">GST Summary</h3>
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Taxable Amount</span>
                                    <span className="font-semibold">{formatCurrency(reportsData.gst.totalTaxable)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">GST Collected</span>
                                    <span className="font-semibold text-blue-600">{formatCurrency(reportsData.gst.totalGST)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Invoices</span>
                                    <span className="font-semibold">{reportsData.gst.totalInvoices}</span>
                                </div>
                                <div className="pt-4 border-t">
                                    <div className="flex justify-between">
                                        <span className="text-gray-900 font-medium">Total Value</span>
                                        <span className="font-bold text-lg">{formatCurrency(reportsData.gst.totalTaxable + reportsData.gst.totalGST)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Aging Report */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900">Aging Report</h3>
                    </div>
                    <div className="p-6">
                        <div className="space-y-4">
                            {Object.keys(reportsData.aging).length > 0 ? (
                                Object.keys(reportsData.aging).map((bucket) => (
                                    <div key={bucket} className="p-4 bg-gray-50 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-semibold text-gray-900">{bucket} Days Overdue</h4>
                                            <ChevronDown className="w-4 h-4 text-gray-500" />
                                        </div>
                                        {reportsData.aging[bucket].length > 0 ? (
                                            <ul className="mt-2 text-sm text-gray-600 space-y-1">
                                                {reportsData.aging[bucket].map(item => (
                                                    <li key={item._id} className="flex justify-between">
                                                        <span>{item.invoiceNumber} - {item.clientId?.name || 'N/A'}</span>
                                                        <span>{formatCurrency(item.balanceDue)}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-gray-500 mt-2">No invoices in this bucket.</p>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500">No overdue invoices found for aging report.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const CreateInvoiceModal = ({ open, onClose }) => {
        const [invoiceData, setInvoiceData] = useState({
            invoiceNumber: '',
            clientId: '',
            dueDate: '',
            lineItems: [{ description: '', quantity: 1, rate: 0 }]
        });
        const [submitting, setSubmitting] = useState(false);

        const handleChange = (e) => {
            const { name, value } = e.target;
            setInvoiceData(prev => ({ ...prev, [name]: value }));
        };

        const handleLineItemChange = (index, e) => {
            const { name, value } = e.target;
            const updatedItems = [...invoiceData.lineItems];
            updatedItems[index][name] = value;
            updatedItems[index].amount = updatedItems[index].quantity * updatedItems[index].rate;
            setInvoiceData(prev => ({ ...prev, lineItems: updatedItems }));
        };

        const addLineItem = () => {
            setInvoiceData(prev => ({
                ...prev,
                lineItems: [...prev.lineItems, { description: '', quantity: 1, rate: 0 }]
            }));
        };

        const handleSubmit = async (e) => {
            e.preventDefault();
            setSubmitting(true);
            try {
                await fetchWithRetry(`${API_BASE_URL}/invoices`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(invoiceData)
                });
                setSubmitting(false);
                onClose();
            } catch (err) {
                console.error('Failed to create invoice:', err);
                setSubmitting(false);
            }
        };

        return (
            <DialogComponent
                open={open}
                onOpenChange={onClose}
                title="Create New Invoice"
                actions={
                    <>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                            disabled={submitting}
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            <span>Create</span>
                        </button>
                    </>
                }
            >
                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
                        <input
                            type="text"
                            name="invoiceNumber"
                            value={invoiceData.invoiceNumber}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Client ID (e.g., 65f3f0f7f7b2c5d1b71d6e1b)</label>
                        <input
                            type="text"
                            name="clientId"
                            value={invoiceData.clientId}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Due Date</label>
                        <input
                            type="date"
                            name="dueDate"
                            value={invoiceData.dueDate}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold text-gray-900">Line Items</h4>
                            <button type="button" onClick={addLineItem} className="text-sm text-blue-600 flex items-center">
                                <Plus className="w-4 h-4 mr-1" /> Add
                            </button>
                        </div>
                        {invoiceData.lineItems.map((item, index) => (
                            <div key={index} className="flex space-x-2 bg-gray-50 p-2 rounded-md">
                                <input
                                    type="text"
                                    name="description"
                                    placeholder="Description"
                                    value={item.description}
                                    onChange={(e) => handleLineItemChange(index, e)}
                                    className="flex-1 border border-gray-300 rounded-md p-2 text-sm"
                                    required
                                />
                                <input
                                    type="number"
                                    name="quantity"
                                    placeholder="Qty"
                                    value={item.quantity}
                                    onChange={(e) => handleLineItemChange(index, e)}
                                    className="w-16 border border-gray-300 rounded-md p-2 text-sm"
                                    required
                                />
                                <input
                                    type="number"
                                    name="rate"
                                    placeholder="Rate"
                                    value={item.rate}
                                    onChange={(e) => handleLineItemChange(index, e)}
                                    className="w-24 border border-gray-300 rounded-md p-2 text-sm"
                                    required
                                />
                            </div>
                        ))}
                    </div>
                </form>
            </DialogComponent>
        );
    };

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-4 text-gray-600">Loading initial data...</span>
        </div>;
    }

    if (error) {
        return <div className="flex items-center justify-center min-h-screen text-red-500">{error}</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col w-full">
            {/* Full-width Header with Tabs */}
            <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10 w-full">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <FileText className="w-8 h-8 text-blue-600" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
                                <p className="text-sm text-gray-600">Manage invoices, payments, and financial reports</p>
                            </div>
                        </div>
                    </div>
                    {/* Tab Navigation */}
                    <div className="flex space-x-1">
                        {[
                            { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
                            { key: 'invoices', label: 'Invoices', icon: FileText },
                            { key: 'reports', label: 'Reports', icon: TrendingUp },
                        ].map(({ key, label, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-all duration-200 ${
                                    activeTab === key
                                        ? 'bg-blue-600 text-white shadow-md'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span>{label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            {/* Main content area */}
            <main className="px-6 py-8 flex-1 w-full">
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'invoices' && <InvoiceList />}
                {activeTab === 'reports' && <Reports />}
            </main>
            {showInvoiceModal && <CreateInvoiceModal open={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} />}
        </div>
    );
};

export default InvoiceManagement;
