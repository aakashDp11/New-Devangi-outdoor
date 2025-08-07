import React, { useEffect, useState } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { Card, CardContent, ShimmerCard } from './UIComponents';

export default function OtherReport({ bookingStats, loadingCharts }) {
    const [pipelineBarData, setPipelineBarData] = useState({ labels: [], values: [] });

    useEffect(() => {
        if (bookingStats.length > 0) {
            processPipelineData();
        }
    }, [bookingStats]);

    const processPipelineData = () => {
        const counts = { bookingConfirmed: 0, artworkReceived: 0, printingStatus: 0, mountingStatus: 0, poReceived: 0, invoiceReceived: 0 };
        bookingStats.forEach((b) => {
            if (b.bookingConfirmed) counts.bookingConfirmed++;
            if (b.artworkReceived) counts.artworkReceived++;
            if (b.poReceived) counts.poReceived++;
            if (b.invoiceReceived) counts.invoiceReceived++;
            counts.printingStatus += b.printingStatus || 0;
            counts.mountingStatus += b.mountingStatus || 0;
        });
        setPipelineBarData({
            labels: ['Booking Confirmed', 'Artwork', 'Printing Status', 'PO', 'Mounting Status', 'Invoice'],
            values: [counts.bookingConfirmed, counts.artworkReceived, counts.printingStatus, counts.poReceived, counts.mountingStatus, counts.invoiceReceived],
        });
    };

    if (loadingCharts) {
        return <ShimmerCard />;
    }

    return (
        <Card className="h-80">
            <CardContent>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base font-semibold text-gray-800">Campaign Status Overview</h3>
                </div>
                <div className="flex flex-grow -mx-4">
                    {/* Conditional rendering to prevent errors with empty/malformed data */}
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
    );
}