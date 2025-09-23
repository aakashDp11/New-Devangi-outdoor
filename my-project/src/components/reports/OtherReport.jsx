import React, { useEffect, useState } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// --- ENHANCED UI HELPER COMPONENTS (ASSUMED TO BE IN UIComponents.jsx or similar) ---
// Since the prompt provided the enhanced UI components within ActivitiesReport.jsx,
// I'll re-include them here for completeness, or you should ensure they are
// correctly imported from a shared file like UIComponents.jsx as suggested.

const Input = ({ error, ...props }) => (
  <div className="relative">
    <input
      className={`w-full px-3 py-2 text-xs border rounded-md focus:outline-none focus:ring-2 transition-all duration-200 ease-in-out transform hover:scale-[1.02] ${
        error
          ? 'border-red-300 focus:ring-red-500 bg-red-50'
          : 'border-gray-300 focus:ring-blue-500 hover:border-blue-300'
      }`}
      {...props}
    />
    {error && (
      <div className="absolute top-full left-0 mt-1 text-xs text-red-600 animate-fade-in-down">
        {error}
      </div>
    )}
  </div>
);

const Button = ({ children, loading, disabled, variant = 'primary', ...props }) => {
  const baseClasses = "px-4 py-2 text-xs font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none";

  const variants = {
    primary: "text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 hover:shadow-lg",
    secondary: "text-gray-700 bg-gray-200 hover:bg-gray-300 focus:ring-gray-500",
    danger: "text-white bg-red-600 hover:bg-red-700 focus:ring-red-500 hover:shadow-lg"
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${loading ? 'animate-pulse' : ''}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
          Loading...
        </div>
      ) : children}
    </button>
  );
};

const Card = ({ children, className }) => (
  <div className={`bg-white shadow-md rounded-lg overflow-hidden transition-all duration-300 ease-in-out hover:shadow-lg transform hover:-translate-y-1 ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children }) => (
  <div className="p-6 animate-fade-in">
    {children}
  </div>
);

// Shimmer Card for loading states
const ShimmerCard = ({ className = "h-40" }) => (
  <div className={`bg-gray-200 rounded-lg animate-pulse ${className}`}>
    <div className="p-6 space-y-4">
      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      <div className="h-4 bg-gray-300 rounded w-full"></div>
    </div>
  </div>
);

// Loading Spinner Component
const LoadingSpinner = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex justify-center items-center py-8">
      <div className={`${sizeClasses[size]} border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin`}></div>
    </div>
  );
};

// Error Message Component
const ErrorMessage = ({ message }) => (
  <div className="text-center py-8 animate-fade-in">
    <div className="inline-flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-md">
      <span>⚠️</span>
      <span className="text-sm">{message}</span>
    </div>
  </div>
);

// You might want to move this handleDownload function to a utility file
const handleDownload = async (url, filename = 'document') => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Download failed');

    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(link.href);
    toast.success('File downloaded successfully!');
  } catch (err) {
    console.error('Download error:', err);
    toast.error('Failed to download file. Please try again.');
  }
};


export default function OtherReport({ bookingStats, loadingCharts }) {
    const [pipelineBarData, setPipelineBarData] = useState({ labels: [], values: [] });
    const [focCampaigns, setFocCampaigns] = useState([]);
    const [allInvoices, setAllInvoices] = useState([]);
    const [totalCampaigns, setTotalCampaigns] = useState(0);
    const navigate = useNavigate();

    // Add CSS for custom animations
    const customStyles = `
    <style>
      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes fade-in-down {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes slide-in-left {
        from { opacity: 0; transform: translateX(-20px); }
        to { opacity: 1; transform: translateX(0); }
      }

      @keyframes slide-in-right {
        from { opacity: 0; transform: translateX(20px); }
        to { opacity: 1; transform: translateX(0); }
      }

      .animate-fade-in {
        animation: fade-in 0.3s ease-in-out;
      }

      .animate-fade-in-down {
        animation: fade-in-down 0.3s ease-in-out;
      }

      .animate-slide-in-left {
        animation: slide-in-left 0.5s ease-in-out;
      }

      .animate-slide-in-right {
        animation: slide-in-right 0.5s ease-in-out;
      }

      .table-row-enter {
        animation: fade-in-down 0.3s ease-in-out;
      }

      .hover-scale:hover {
        transform: scale(1.02);
        transition: transform 0.2s ease-in-out;
      }
    </style>
  `;

    useEffect(() => {
        if (bookingStats && bookingStats.length > 0) {
            processPipelineData();
            extractAllInvoices();
        } else if (bookingStats && bookingStats.length === 0 && !loadingCharts) {
            // If no data and not loading, reset to clear old data
            setPipelineBarData({ labels: [], values: [] });
            setFocCampaigns([]);
            setAllInvoices([]);
            setTotalCampaigns(0);
        }
    }, [bookingStats, loadingCharts]); // Include loadingCharts here to react when it becomes false

    const processPipelineData = () => {
        const total = bookingStats.length;
        setTotalCampaigns(total);

        const counts = { bookingConfirmed: 0, artworkReceived: 0, printingStatus: 0, mountingStatus: 0, poReceived: 0, invoiceReceived: 0 };
        const focList = [];
        bookingStats.forEach((b) => {
            if (b.bookingConfirmed) counts.bookingConfirmed++;
            if (b.artworkReceived) counts.artworkReceived++;
            if (b.poReceived) counts.poReceived++;
            if (b.invoiceReceived) counts.invoiceReceived++;
            counts.printingStatus += b.printingStatus || 0; // Assuming printingStatus and mountingStatus are numbers
            counts.mountingStatus += b.mountingStatus || 0; // If they are booleans, change to 'if (b.printingStatus) counts.printingStatus++'
            if (b.isFOC) {
                focList.push(b);
            }
        });
        setPipelineBarData({
            labels: ['Booking Confirmed', 'Artwork', 'Printing Status', 'PO', 'Mounting Status', 'Invoice'],
            values: [counts.bookingConfirmed, counts.artworkReceived, counts.printingStatus, counts.poReceived, counts.mountingStatus, counts.invoiceReceived],
        });
        setFocCampaigns(focList);
    };

    const extractAllInvoices = () => {
        const invoices = bookingStats.reduce((acc, campaign) => {
            if (campaign.invoices && campaign.invoices.length > 0) {
                const campaignInvoices = campaign.invoices.map(invoice => ({
                    ...invoice,
                    campaignName: campaign.campaignName,
                    clientName: campaign.clientName,
                    companyName: campaign.companyName,
                }));
                return [...acc, ...campaignInvoices];
            }
            return acc;
        }, []);
        setAllInvoices(invoices);
    };


    const handleRowClick = (campaignId) => {
        if (campaignId) {
            navigate(`/campaign-details/${campaignId}`);
        }
    };

    if (loadingCharts) {
        return (
            <div className="space-y-6 animate-fade-in">
                <ShimmerCard className="h-80" />
                <ShimmerCard className="h-80" />
                <ShimmerCard className="h-80" />
            </div>
        );
    }

    return (
        <>
            <div dangerouslySetInnerHTML={{ __html: customStyles }} />
            <div className="space-y-6 animate-fade-in">
                <Card className="h-auto min-h-80"> {/* Adjusted height */}
                    <CardContent>
                        <div className="flex justify-between items-center mb-4 animate-slide-in-left">
                            <h3 className="text-base font-semibold text-gray-800">Campaign Status Overview</h3>
                            {totalCampaigns > 0 && (
                                <span className="text-sm text-gray-600 animate-fade-in-down">
                                    Total Campaigns: <span className="font-bold">{totalCampaigns}</span>
                                </span>
                            )}
                        </div>
                        <div className="flex flex-grow -mx-4 h-64"> {/* Fixed height for chart */}
                            {pipelineBarData.labels.length > 0 ? (
                                <BarChart
                                    xAxis={[{ scaleType: 'band', data: pipelineBarData.labels, categoryGapRatio: 0.6 }]}
                                    series={[{
                                        data: pipelineBarData.values,
                                        label: 'Campaign Count',
                                        color: '#3b82f6',
                                        valueFormatter: (value) => `${value} (${totalCampaigns > 0 ? ((value / totalCampaigns) * 100).toFixed(1) : 0}%)`
                                    }]}
                                    borderRadius={5}
                                    slotProps={{ legend: { hidden: true } }}
                                    className="w-full animate-fade-in"
                                />
                            ) : (
                                <div className="flex items-center justify-center w-full py-10 text-gray-500 animate-fade-in">
                                    No campaign data available for overview.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <h3 className="text-base font-semibold text-gray-800 mb-4 animate-slide-in-left">FOC Campaigns Report</h3>
                        <div className="overflow-auto max-h-80 relative shadow-md sm:rounded-lg bg-white">
                            {focCampaigns.length > 0 ? (
                                <table className="min-w-full divide-y divide-gray-200 text-xs text-left text-gray-600">
                                    <thead className="bg-gray-50 text-xs text-gray-700 uppercase tracking-wider">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 font-semibold">Campaign Name</th>
                                            <th scope="col" className="px-6 py-3 font-semibold">Company Name</th>
                                            <th scope="col" className="px-6 py-3 font-semibold">Client Name</th>
                                            <th scope="col" className="px-6 py-3 font-semibold">Start Date</th>
                                            <th scope="col" className="px-6 py-3 font-semibold">End Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
  {focCampaigns.map((campaign, index) => (
    <tr
      key={index}
      onClick={() => handleRowClick(campaign.campaignId)}
      className={`hover:bg-gray-50 cursor-pointer transition-colors duration-150 animate-fade-in-down ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
        {campaign.campaignName || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
        {campaign.companyName || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
        {campaign.clientName || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
        {campaign.startDate || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
        {campaign.endDate || 'N/A'}
      </td>
    </tr>
  ))}
</tbody>
                                </table>
                            ) : (
                                <div className="flex items-center justify-center py-10 animate-fade-in">
                                    <p className="text-sm text-gray-500">No FOC campaigns found.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent>
                        <h3 className="text-base font-semibold text-gray-800 mb-4 animate-slide-in-left">All Invoices Report</h3>
                        <div className="overflow-auto max-h-80 relative shadow-md sm:rounded-lg bg-white">
                            {allInvoices.length > 0 ? (
                                <table className="min-w-full divide-y divide-gray-200 text-xs text-left text-gray-600">
                                    <thead className="bg-gray-50 text-xs text-gray-700 uppercase tracking-wider">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 font-semibold">Invoice Name</th>
                                            <th scope="col" className="px-6 py-3 font-semibold">Campaign Name</th>
                                            <th scope="col" className="px-6 py-3 font-semibold">Client Name</th>
                                            <th scope="col" className="px-6 py-3 font-semibold">Download</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
  {allInvoices.map((invoice, index) => (
    <tr
      key={index}
      className={`hover:bg-gray-50 cursor-pointer transition-colors duration-150 animate-fade-in-down ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {invoice.documentName || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {invoice.campaignName || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {invoice.clientName || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {invoice.fileUrl && (
          <Button
            onClick={() => handleDownload(invoice.fileUrl, invoice.documentName || 'invoice')}
            variant="secondary"
          >
            Download
          </Button>
        )}
      </td>
    </tr>
  ))}
</tbody>
                                </table>
                            ) : (
                                <div className="flex items-center justify-center py-10 animate-fade-in">
                                    <p className="text-sm text-gray-500">No invoices found.</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}