import React, { useState, useEffect } from 'react';
import { fetchOutstandingReport, fetchMonthlySummary, fetchGSTReport, fetchAgingReport } from '../services/invoiceApi'; 
import LoadingSpinner from '../components/LoadingSpinner';
import { FaChartBar, FaUserFriends, FaCalendarAlt, FaMoneyBillWave } from 'react-icons/fa';
import { Toaster, toast } from 'sonner';

// Utility component to render individual reports
const ReportSection = ({ title, data, renderTable, icon: Icon, number }) => (
    // Reduced section padding (p-4 instead of p-6) and mb-4 instead of mb-8
    <div className="bg-white p-4 rounded-lg shadow-md mb-4 border border-gray-100">
        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2 border-b pb-2">
            <span className="text-indigo-600 font-extrabold">{number}.</span>
            {title}
        </h3>
        {data ? renderTable(data) : <p className="text-gray-500 py-3">No data available or filters needed.</p>}
    </div>
);

const ReportsDashboard = () => {
    const [reports, setReports] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadReports = async () => {
            try {
                // Fetch all reports concurrently
                const [outstanding, monthly, gst, aging] = await Promise.all([
                    fetchOutstandingReport(),
                    fetchMonthlySummary(),
                    // Using a dummy date range for GST report for demonstration (Jan 1st 2024 to today)
                    fetchGSTReport('2024-01-01', new Date().toISOString().split('T')[0]), 
                    fetchAgingReport()
                ]);

                setReports({
                    outstanding: outstanding.data,
                    monthly: monthly.data,
                    gst: gst.data,
                    aging: aging.data
                });
            } catch (err) {
                toast.error("Failed to load one or more reports. Check the reports backend service.");
                console.error("Failed to load reports:", err);
            } finally {
                setLoading(false);
            }
        };
        loadReports();
    }, []);

    if (loading) return <LoadingSpinner />;

    return (
        // Outer container using increased padding (p-6) only for left/right margins
        <div className="p-4 sm:px-6 md:px-8 py-4 bg-gray-50 min-h-screen">
            <Toaster position="top-right" />
            {/* REMOVED: max-w-7xl mx-auto container */}
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-2">
                    <FaChartBar className="text-indigo-600" />
                    Invoicing Reports & Analytics
                </h2>
                
                {/* Layout change: Grid is now full width */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* 1. Outstanding Per Client */}
                    <ReportSection
                        number={1}
                        title="Outstanding Per Client"
                        icon={FaUserFriends}
                        data={reports.outstanding}
                        renderTable={(data) => (
                            <div className="max-h-64 overflow-y-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50 sticky top-0"><tr><th className="p-2 text-left">Client</th><th className="p-2 text-right">Billed</th><th className="p-2 text-right">Paid</th><th className="p-2 text-right">Balance Due</th></tr></thead>
                                    <tbody>
                                        {data.map(r => (
                                            <tr key={r._id} className="hover:bg-gray-50">
                                                <td className="p-2 truncate">{r.client?.name || `ID: ${r._id}`}</td>
                                                <td className="p-2 text-right">${r.totalBilled.toFixed(2)}</td>
                                                <td className="p-2 text-right">${r.totalPaid.toFixed(2)}</td>
                                                <td className="p-2 font-bold text-red-600 text-right">${r.balanceDue.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                </tbody>
                                </table>
                            </div>
                        )}
                    />

                    {/* 2. Monthly Summary */}
                    <ReportSection
                        number={2}
                        title="Monthly Invoice Summary"
                        icon={FaCalendarAlt}
                        data={reports.monthly}
                        renderTable={(data) => (
                            <div className="max-h-64 overflow-y-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50 sticky top-0"><tr><th className="p-2 text-left">Month</th><th className="p-2 text-right">Count</th><th className="p-2 text-right">Billed</th><th className="p-2 text-right">Paid</th></tr></thead>
                                    <tbody>
                                        {data.map(r => (
                                            <tr key={`${r._id.year}-${r._id.month}`} className="hover:bg-gray-50">
                                                <td className="p-2 text-left">{r._id.year}-{String(r._id.month).padStart(2, '0')}</td>
                                                <td className="p-2 text-right">{r.invoiceCount}</td>
                                                <td className="p-2 text-right">${r.totalBilled.toFixed(2)}</td>
                                                <td className="p-2 text-right">${r.totalPaid.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                </tbody>
                                </table>
                            </div>
                        )}
                    />

                    {/* 3. GST / Tax Report */}
                    <ReportSection
                        number={3}
                        title="GST / Tax Report (Current Period)"
                        icon={FaMoneyBillWave}
                        data={reports.gst}
                        renderTable={(data) => (
                            // Grid structure now stretches full width
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div className="p-3 border rounded-lg bg-indigo-50/70">
                                    <p className="text-xs text-indigo-800 font-semibold">Total Invoices</p>
                                    <p className="text-xl font-bold text-indigo-900 mt-1">{data.totalInvoices}</p>
                                </div>
                                <div className="p-3 border rounded-lg bg-green-50/70">
                                    <p className="text-xs text-green-800 font-semibold">Total Taxable Value</p>
                                    <p className="text-xl font-bold text-green-900 mt-1">${data.totalTaxable.toFixed(2)}</p>
                                </div>
                                <div className="p-3 border rounded-lg bg-orange-50/70">
                                    <p className="text-xs text-orange-800 font-semibold">Total GST Collected</p>
                                    <p className="text-xl font-bold text-orange-900 mt-1">${data.totalGST.toFixed(2)}</p>
                                </div>
                            </div>
                        )}
                    />
                    
                    {/* 4. Accounts Receivable Aging - Spanning both columns is natural now */}
                    <div className="lg:col-span-2">
                        <ReportSection
                            number={4}
                            title="Accounts Receivable Aging"
                            icon={FaCalendarAlt}
                            data={reports.aging}
                            renderTable={(data) => (
                                // Grid structure for aging buckets
                                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                    {Object.keys(data).map(bucket => (
                                        <div key={bucket} className="border border-gray-200 p-3 rounded-lg bg-red-50/50">
                                            <h4 className="font-bold text-sm mb-1 text-red-800">{bucket} Overdue</h4>
                                            <p className="text-xl font-extrabold text-red-900 mb-2">
                                                ${data[bucket].reduce((sum, inv) => sum + inv.balanceDue, 0).toFixed(2)}
                                            </p>
                                            <ul className="text-xs space-y-1 max-h-24 overflow-y-auto pr-1">
                                                {data[bucket].map(inv => (
                                                    <li key={inv._id} className="text-gray-600 truncate">
                                                        #{inv.invoiceNumber} - **${inv.balanceDue.toFixed(2)}**
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}
                        />
                    </div>
                </div>
        </div>
    );
};

export default ReportsDashboard;