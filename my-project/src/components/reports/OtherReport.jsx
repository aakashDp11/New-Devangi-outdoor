import React, { useEffect, useState } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { Card, CardContent, ShimmerCard } from './UIComponents';
import { useNavigate } from 'react-router-dom';
import PdfLogo from '../../assets/pdf.png';
import { toast } from 'sonner';

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
  } catch (err) {
    console.error('Download error:', err);
    toast.error('Failed to download file. Please try again.');
  }
};


export default function OtherReport({ bookingStats, loadingCharts }) {
    const [pipelineBarData, setPipelineBarData] = useState({ labels: [], values: [] });
    const [focCampaigns, setFocCampaigns] = useState([]);
    const [allInvoices, setAllInvoices] = useState([]); // State for all invoices
    // --- CHANGE 1: ADD STATE FOR TOTAL CAMPAIGNS ---
    const [totalCampaigns, setTotalCampaigns] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        if (bookingStats && bookingStats.length > 0) {
            processPipelineData();
            extractAllInvoices(); // Extract invoices when bookingStats are available
        }
    }, [bookingStats]);

    const processPipelineData = () => {
        // --- CHANGE 2: CALCULATE AND SET THE TOTAL ---
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

    // New function to extract all invoices from bookingStats (Unchanged)
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
            <div className="space-y-6">
                <ShimmerCard className="h-80" />
                <ShimmerCard className="h-80" />
                <ShimmerCard className="h-80" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="h-80">
                <CardContent>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-semibold text-gray-800">Campaign Status Overview</h3>
                    </div>
                    <div className="flex flex-grow -mx-4">
                        {pipelineBarData.labels.length > 0 && (
                             <BarChart
                                xAxis={[{ scaleType: 'band', data: pipelineBarData.labels, categoryGapRatio: 0.6 }]}
                                // --- CHANGE 3: UPDATE BAR CHART SERIES WITH VALUE FORMATTER ---
                                series={[{ 
                                    data: pipelineBarData.values, 
                                    label: 'Campaign Count', 
                                    color: '#3b82f6',
                                    valueFormatter: (value) => `${value} (${totalCampaigns > 0 ? ((value / totalCampaigns) * 100).toFixed(1) : 0}%)`
                                }]}
                                borderRadius={5}
                                slotProps={{ legend: { hidden: true } }}
                            />
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* FOC Campaigns Report Table (Unchanged) */}
            <Card>
                <CardContent>
                    <h3 className="text-base font-semibold text-gray-800 mb-4">FOC Campaigns Report</h3>
                    <div className="overflow-auto max-h-80">
                        {focCampaigns.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Campaign Name
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Company Name
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Client Name
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Start Date
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            End Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {focCampaigns.map((campaign, index) => (
                                        <tr
                                            key={index}
                                            onClick={() => handleRowClick(campaign.campaignId)}
                                            className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {campaign.campaignName || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {campaign.companyName || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {campaign.clientName || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {campaign.startDate || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {campaign.endDate || 'N/A'}
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
                </CardContent>
            </Card>

            {/* All Invoices Report Table (Unchanged) */}
            <Card>
                <CardContent>
                    <h3 className="text-base font-semibold text-gray-800 mb-4">All Invoices Report</h3>
                    <div className="overflow-auto max-h-80">
                        {allInvoices.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Invoice Name
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Campaign Name
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Client Name
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Download
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {allInvoices.map((invoice, index) => (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
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
                                                    <button
                                                        onClick={() => handleDownload(invoice.fileUrl, invoice.documentName || 'invoice')}
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        Download
                                                    </button>
                                                )}
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
                </CardContent>
            </Card>
        </div>
    );
}