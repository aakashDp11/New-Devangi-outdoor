// C:\Users\rajes\Downloads\New-Devangi-outdoor-optimization (5)\New-Devangi-outdoor-optimization\my-project\src\components\InvoiceReports.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowLeft, FaChartBar, FaCalendar, FaFileInvoice, FaClock
} from 'react-icons/fa';
import {
  getOutstandingReport,
  getMonthlySummary,
  getGSTReport,
  getAgingReport
} from '../services/invoiceService';

export default function InvoiceReports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('outstanding');
  
  // Report data
  const [outstandingData, setOutstandingData] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [gstData, setGstData] = useState(null);
  const [agingData, setAgingData] = useState(null);
  
  // GST date filters
  const [gstStartDate, setGstStartDate] = useState('');
  const [gstEndDate, setGstEndDate] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [outstanding, monthly, aging] = await Promise.all([
        getOutstandingReport(),
        getMonthlySummary(),
        getAgingReport()
      ]);
      
      setOutstandingData(outstanding);
      setMonthlySummary(monthly);
      setAgingData(aging);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGSTReport = async () => {
    if (!gstStartDate || !gstEndDate) {
      alert('Please select both start and end dates');
      return;
    }
    
    try {
      const data = await getGSTReport(gstStartDate, gstEndDate);
      setGstData(data);
    } catch (error) {
      console.error('Error fetching GST report:', error);
      alert('Failed to fetch GST report');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getMonthName = (month) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1];
  };

  const tabs = [
    { id: 'outstanding', label: 'Outstanding by Client', icon: <FaFileInvoice /> },
    { id: 'monthly', label: 'Monthly Summary', icon: <FaCalendar /> },
    { id: 'gst', label: 'GST Report', icon: <FaChartBar /> },
    { id: 'aging', label: 'Aging Report', icon: <FaClock /> }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 md:ml-24">
        <div className="max-w-7xl mx-auto bg-white p-8 rounded-lg shadow text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

 return (
    <div className="min-h-screen bg-gray-50 w-full"> {/* Removed p-6 and md:ml-24 */}
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8"> {/* Added p-4/p-6 back to inner div for inner spacing */}
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/misc-invoices')}
              className="text-gray-600 hover:text-gray-900"
            >
              <FaArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Invoice Reports</h1>
              <p className="text-gray-600 mt-1">Comprehensive financial insights</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Outstanding by Client */}
        {activeTab === 'outstanding' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Outstanding Balance by Client</h2>
              <p className="text-sm text-gray-600 mt-1">View total billed, paid, and outstanding amounts per client</p>
            </div>
            {outstandingData.length === 0 ? (
              <div className="p-8 text-center text-gray-600">No outstanding data available</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Billed</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Paid</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance Due</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {outstandingData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                            {/* FIX: The ternary ensures 'L' is displayed correctly for 'legacy' type */}
                          {item.client?.name || 'N/A'} 
                            <span className="text-xs text-gray-500 ml-1">
                                ({item.client?.type ? item.client.type.charAt(0).toUpperCase() : 'N/A'})
                            </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-gray-900">
                          {formatCurrency(item.totalBilled)}
                        </td>
                        <td className="px-6 py-4 text-sm text-right text-green-600">
                          {formatCurrency(item.totalPaid)}
                      </td>
                        <td className="px-6 py-4 text-sm text-right text-red-600 font-semibold">
                          {formatCurrency(item.balanceDue)}
                      </td>
                    </tr>
                    ))}
                    <tr className="bg-gray-100 font-bold">
                      <td className="px-6 py-4 text-sm text-gray-900">TOTAL</td>
                      <td className="px-6 py-4 text-sm text-right text-gray-900">
                        {formatCurrency(outstandingData.reduce((sum, i) => sum + i.totalBilled, 0))}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-green-600">
                        {formatCurrency(outstandingData.reduce((sum, i) => sum + i.totalPaid, 0))}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-red-600">
                        {formatCurrency(outstandingData.reduce((sum, i) => sum + i.balanceDue, 0))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Monthly Summary */}
        {activeTab === 'monthly' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Monthly Summary</h2>
              <p className="text-sm text-gray-600 mt-1">Invoice statistics by month</p>
            </div>
            {monthlySummary.length === 0 ? (
              <div className="p-8 text-center text-gray-600">No monthly data available</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Invoice Count</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Billed</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Paid</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Collection %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {monthlySummary.map((item, index) => {
                      const collectionRate = item.totalBilled > 0 
                        ? ((item.totalPaid / item.totalBilled) * 100).toFixed(1) 
                        : 0;
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                            {getMonthName(item._id.month)} {item._id.year}
                          </td>
                          <td className="px-6 py-4 text-sm text-right text-gray-900">
                            {item.invoiceCount}
                          </td>
                          <td className="px-6 py-4 text-sm text-right text-gray-900">
                            {formatCurrency(item.totalBilled)}
                          </td>
                          <td className="px-6 py-4 text-sm text-right text-green-600">
                            {formatCurrency(item.totalPaid)}
                          </td>
                          <td className="px-6 py-4 text-sm text-right">
                            <span className={`font-semibold ${
                              collectionRate >= 80 ? 'text-green-600' : 
                              collectionRate >= 50 ? 'text-yellow-600' : 
                              'text-red-600'
                            }`}>
                              {collectionRate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* GST Report */}
        {activeTab === 'gst' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">GST Report</h2>
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={gstStartDate}
                    onChange={(e) => setGstStartDate(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={gstEndDate}
                    onChange={(e) => setGstEndDate(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={fetchGSTReport}
                    className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 whitespace-nowrap"
                  >
                    Generate Report
                  </button>
                </div>
              </div>
            </div>
            {gstData && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Total Invoices</p>
                    <p className="text-3xl font-bold text-blue-600">{gstData.totalInvoices}</p>
                  </div>
                  <div className="bg-green-50 p-6 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Total Taxable Amount</p>
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(gstData.totalTaxable)}</p>
                  </div>
                  <div className="bg-orange-50 p-6 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Total GST Collected</p>
                    <p className="text-3xl font-bold text-orange-600">{formatCurrency(gstData.totalGST)}</p>
                  </div>
                </div>
              </div>
            )}
            {!gstData && (
              <div className="p-8 text-center text-gray-600">
                Select date range and click "Generate Report" to view GST data
              </div>
            )}
          </div>
        )}

        {/* Aging Report */}
        {activeTab === 'aging' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Aging Report</h2>
              <p className="text-sm text-gray-600 mt-1">Outstanding invoices by age</p>
            </div>
            {agingData && (
              <div className="p-6 space-y-6">
                {Object.entries(agingData).map(([bucket, invoices]) => {
                  const totalDue = invoices.reduce((sum, inv) => sum + inv.balanceDue, 0);
                  return (
                    <div key={bucket} className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-6 py-3 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">{bucket} Days</h3>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600">{invoices.length} invoices</span>
                          <span className="font-bold text-red-600">{formatCurrency(totalDue)}</span>
                        </div>
                      </div>
                      {invoices.length > 0 && (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500">Invoice #</th>
                                <th className="px-6 py-2 text-left text-xs font-medium text-gray-500">Client</th>
                                <th className="px-6 py-2 text-right text-xs font-medium text-gray-500">Balance Due</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {invoices.map((invoice) => (
                                <tr key={invoice._id} className="hover:bg-gray-50">
                                  <td className="px-6 py-3 text-sm text-gray-900">{invoice.invoiceNumber}</td>
                                  <td className="px-6 py-3 text-sm text-gray-600">{invoice.clientId?.name || 'N/A'}</td>
                                  <td className="px-6 py-3 text-sm text-right text-red-600 font-semibold">
                                    {formatCurrency(invoice.balanceDue)}
                                </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}