import React, { useEffect, useState } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CircularProgress } from '@mui/material';
import { FaArrowLeft, FaArrowRight, FaExclamationTriangle, FaCheck } from 'react-icons/fa';
import dayjs from 'dayjs'; // <-- FIX: ADDED MISSING IMPORT

// --- NEW/OVERRIDDEN UI HELPER COMPONENTS (Using RevenueReport styling) ---

// Card (Overridden)
const Card = ({ children, className = '', ...props }) => (
    <div
        className={`w-full flex flex-col relative overflow-hidden ${className}`}
        {...props}
    >
        <div className="relative z-10 h-full flex flex-col p-0">
            {children}
        </div>
    </div>
);

// CardContent (Overridden)
const CardContent = ({ children, className = '' }) => (
    <div className={`
        flex-grow flex flex-col bg-white shadow-xl rounded-2xl border border-gray-200 p-6 md:p-8
        ${className}
    `}>
        {children}
    </div>
);

// ShimmerCard (Overridden)
const ShimmerCard = ({ className = '' }) => (
    <div className={`h-80 bg-white rounded-2xl animate-pulse shadow-md border border-gray-200 ${className}`}>
        <div className="p-6 h-full flex items-center justify-center text-gray-400">
            Loading Chart...
        </div>
    </div>
);

// Button (Defined locally with RevenueReport style for consistency)
const Button = ({ children, className = '', disabled = false, loading = false, ...props }) => (
    <button
        className={`
            px-4 py-2 rounded-xl bg-black text-white text-xs font-medium 
            transition-all duration-200 transform 
            hover:scale-105 hover:opacity-90 active:scale-95 
            disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none 
            shadow-md hover:shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-black
            ${className}
        `}
        disabled={disabled || loading}
        {...props}
    >
        {loading ? (
            <div className='flex items-center gap-2'>
                <div className='w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                {children}
            </div>
        ) : (
            children
        )}
    </button>
);

// Helper function (Assumed to be utility file, left as is)
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
        toast.success("File download started.");
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

    useEffect(() => {
        if (bookingStats && bookingStats.length > 0) {
            processPipelineData();
            extractAllInvoices();
        }
    }, [bookingStats]);

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
            counts.printingStatus += b.printingStatus || 0;
            counts.mountingStatus += b.mountingStatus || 0;
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
                    campaignId: campaign._id, // Added ID for navigation
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

    const percentageFormatter = (value) => `${value} (${totalCampaigns > 0 ? ((value / totalCampaigns) * 100).toFixed(1) : 0}%)`;


    if (loadingCharts) {
        return (
            <div className="space-y-6">
                <ShimmerCard className="h-80" />
                <ShimmerCard className="h-96" />
                <ShimmerCard className="h-96" />
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {/* 1. Campaign Status Overview (Pipeline Bar Chart) */}
            <CardContent className="h-96">
                <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-4">
                    <h3 className="text-xl font-sans font-normal text-black">Campaign Status Overview</h3>
                    <p className="font-semibold text-sm text-gray-700">Total Campaigns: {totalCampaigns}</p>
                </div>
                <div className="flex flex-grow h-full -mx-4">
                    {pipelineBarData.labels.length > 0 ? (
                            <BarChart
                                height={300} // Adjusted height to fit CardContent better
                                xAxis={[{ scaleType: 'band', data: pipelineBarData.labels, categoryGapRatio: 0.6, tickLabelStyle: { fontSize: 10 } }]}
                                yAxis={[{ label: 'Number of Campaigns' }]}
                                series={[{ 
                                    data: pipelineBarData.values, 
                                    label: 'Campaign Count', 
                                    color: '#8b5cf6', // Purple color consistent with RevenueReport
                                    valueFormatter: percentageFormatter
                                }]}
                                borderRadius={5}
                                slotProps={{ legend: { hidden: true } }}
                                margin={{ top: 40, right: 20, bottom: 50, left: 60 }}
                            />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full text-gray-500">No data available for pipeline chart.</div>
                    )}
                </div>
            </CardContent>

            {/* 2. FOC Campaigns Report Table */}
            <CardContent>
                <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-4">
                    <h3 className="text-xl font-sans font-normal text-black">FOC Campaigns Report ({focCampaigns.length})</h3>
                    {/* Placeholder for future download button if API endpoint is added */}
                </div>
                <div className="bg-white shadow-xl rounded-xl animate-slideUp w-full overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto max-h-96">
                        {focCampaigns.length > 0 ? (
                            <table className="w-full text-xs text-left text-gray-600">
                                <thead className="text-xs text-black uppercase bg-gray-100 sticky top-0 z-10 border-b border-gray-300">
                                    <tr className="border-b-2 border-gray-200">
                                        <th scope="col" className="px-6 py-4 text-left font-semibold text-black uppercase tracking-wider">Campaign Name</th>
                                        <th scope="col" className="px-6 py-4 text-left font-semibold text-black uppercase tracking-wider">Company Name</th>
                                        <th scope="col" className="px-6 py-4 text-left font-semibold text-black uppercase tracking-wider">Client Name</th>
                                        <th scope="col" className="px-6 py-4 text-left font-semibold text-black uppercase tracking-wider">Start Date</th>
                                        <th scope="col" className="px-6 py-4 text-left font-semibold text-black uppercase tracking-wider">End Date</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {focCampaigns.map((campaign, index) => (
                                        <tr
                                            key={campaign._id || index}
                                            onClick={() => handleRowClick(campaign.campaignId)}
                                            className={`transition-all duration-200 border-b border-gray-100 last:border-b-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50/50 hover:shadow-inner cursor-pointer`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                                                {campaign.campaignName || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                                                {campaign.companyName || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                                                {campaign.clientName || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                                                {campaign.startDate ? dayjs(campaign.startDate).format("DD MMM YYYY") : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                                                {campaign.endDate ? dayjs(campaign.endDate).format("DD MMM YYYY") : 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex items-center justify-center py-10">
                                <p className="text-sm text-gray-500">No FOC campaigns found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>

            {/* 3. All Invoices Report Table */}
            <CardContent>
                <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-4">
                    <h3 className="text-xl font-sans font-normal text-black">All Invoices Report ({allInvoices.length})</h3>
                    {/* Placeholder for future download button if API endpoint is added */}
                </div>
                <div className="bg-white shadow-xl rounded-xl animate-slideUp w-full overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto max-h-96">
                        {allInvoices.length > 0 ? (
                            <table className="w-full text-xs text-left text-gray-600">
                                <thead className="text-xs text-black uppercase bg-gray-100 sticky top-0 z-10 border-b border-gray-300">
                                    <tr className="border-b-2 border-gray-200">
                                        <th scope="col" className="px-6 py-4 text-left font-semibold text-black uppercase tracking-wider">Invoice Name</th>
                                        <th scope="col" className="px-6 py-4 text-left font-semibold text-black uppercase tracking-wider">Campaign Name</th>
                                        <th scope="col" className="px-6 py-4 text-left font-semibold text-black uppercase tracking-wider">Client Name</th>
                                        <th scope="col" className="px-6 py-4 text-left font-semibold text-black uppercase tracking-wider">Download</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {allInvoices.map((invoice, index) => (
                                        <tr 
                                            key={invoice.documentName + index} 
                                            className={`transition-all duration-200 border-b border-gray-100 last:border-b-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50/50 hover:shadow-inner`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                                                {invoice.documentName || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                                                {invoice.campaignName || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                                                {invoice.clientName || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {invoice.fileUrl ? (
                                                     <Button
                                                         onClick={() => handleDownload(invoice.fileUrl, invoice.documentName || 'invoice')}
                                                         className="!px-3 !py-1 !text-xs bg-indigo-600 hover:bg-indigo-700"
                                                     >
                                                         Download
                                                     </Button>
                                                ) : "N/A"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="flex items-center justify-center py-10">
                                <p className="text-sm text-gray-500">No invoices found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>

            {/* Tailwind Keyframes/Animation Styles (Copied for consistency) */}
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