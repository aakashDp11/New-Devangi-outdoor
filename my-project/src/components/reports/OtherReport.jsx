import React, { useEffect, useState } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { Card, CardContent, ShimmerCard } from './UIComponents';
import { useNavigate } from 'react-router-dom';

export default function OtherReport({ bookingStats, loadingCharts }) {
    const [pipelineBarData, setPipelineBarData] = useState({ labels: [], values: [] });
    const [focCampaigns, setFocCampaigns] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        if (bookingStats && bookingStats.length > 0) {
            processPipelineData();
        }
    }, [bookingStats]);

    const processPipelineData = () => {
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

    const handleRowClick = (campaignId) => {
        // Navigates to the campaign details page, matching your App.jsx route
        if (campaignId) {
            navigate(`/campaign-details/${campaignId}`);
        }
    };

    if (loadingCharts) {
        return (
            <div className="space-y-6">
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
                                series={[{ data: pipelineBarData.values, label: 'Campaign Count', color: '#3b82f6' }]}
                                borderRadius={5}
                                slotProps={{ legend: { hidden: true } }}
                            />
                        )}
                    </div>
                </CardContent>
            </Card>

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
                                        {/* MODIFICATION 1: Add new table header */}
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
                                            {/* MODIFICATION 2: Add new table data cell */}
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
        </div>
    );
}