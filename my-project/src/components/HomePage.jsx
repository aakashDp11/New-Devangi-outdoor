import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import Navbar from './Navbar';
import { useState, useEffect, useRef } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LineChart } from '@mui/x-charts/LineChart';
import {
    FiChevronLeft,
    FiChevronRight,
} from 'react-icons/fi';
import { useSidebar } from '../context/SidebarContext';
import moment from 'moment';

dayjs.extend(isBetween);

const Card = ({ children, className = '', ...props }) => (
    <div className={`
        bg-white border border-gray-200 shadow-md rounded-2xl w-full flex flex-col relative overflow-hidden
        ${className}
    `} {...props}>
        <div className="relative z-10 h-full flex flex-col">
            {children}
        </div>
    </div>
);

const CardContent = ({ children, className = '' }) => (
    <div className={`p-3 md:p-4 flex-grow flex flex-col ${className}`}>{children}</div>
);

const ShimmerCard = ({ className = '' }) => (
    <div className={`
        bg-gray-200 animate-shimmer rounded-2xl w-full h-full 
        relative overflow-hidden ${className}
    `}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-300 to-transparent animate-shimmer-flow"></div>
    </div>
);

const DashboardCalendar = ({ campaigns, currentDate, setCurrentDate }) => {
    const [days, setDays] = useState([]);
    const [events, setEvents] = useState(new Map());
    const [tooltip, setTooltip] = useState({
        visible: false,
        content: '',
        x: 0,
        y: 0,
    });
    const tooltipTimeoutRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const eventMap = new Map();

        if (Array.isArray(campaigns)) {
            campaigns.forEach(campaign => {
                const campaignInfo = {
                    id: campaign._id,
                    campaignName: campaign.campaignName || 'Unnamed Campaign',
                };

                if (campaign.startDate) {
                    const startDateStr = dayjs(campaign.startDate).format('YYYY-MM-DD');
                    const dayEvents = eventMap.get(startDateStr) || { startingCampaigns: [], endingCampaigns: [] };
                    dayEvents.startingCampaigns.push(campaignInfo);
                    eventMap.set(startDateStr, dayEvents);
                }

                if (campaign.endDate) {
                    const endDateStr = dayjs(campaign.endDate).format('YYYY-MM-DD');
                    const dayEvents = eventMap.get(endDateStr) || { startingCampaigns: [], endingCampaigns: [] };
                    dayEvents.endingCampaigns.push(campaignInfo);
                    eventMap.set(endDateStr, dayEvents);
                }
            });
        }

        setEvents(eventMap);
    }, [campaigns]);

    useEffect(() => {
        const start = currentDate.startOf('month'),
            end = currentDate.endOf('month'),
            first = start.startOf('week'),
            last = end.endOf('week');
        const d = [];
        let day = first;
        while (day.isBefore(last) || day.isSame(last, 'day')) {
            d.push(day);
            day = day.add(1, 'day');
        }
        setDays(d);
    }, [currentDate]);

    const p = () => setCurrentDate(currentDate.subtract(1, 'month'));
    const n = () => setCurrentDate(currentDate.add(1, 'month'));

    const handleNavigate = (bookingId) => {
        if (bookingId) {
            navigate(`/campaign-details/${bookingId}`);
        }
    };

    const handleMouseOver = (e, campaigns, type) => {
        if (!campaigns || campaigns.length === 0) return;

        clearTimeout(tooltipTimeoutRef.current);

        const isStarting = type === 'starting';
        const title = isStarting ? 'Campaigns Starting Today:' : 'Campaigns Ending Today:';
        const dotColorClass = isStarting ? 'bg-emerald-500' : 'bg-rose-500';

        const tooltipContent = (
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${dotColorClass}`}></div>
                    <p className="font-bold text-white">{title}</p>
                </div>
                <div className="space-y-1.5 pl-1">
                    {campaigns.map((campaign, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${dotColorClass}`}></div>
                            <span
                                className="cursor-pointer text-sm text-white hover:underline transition-all duration-200"
                                onClick={() => handleNavigate(campaign.id)}
                            >
                                {campaign.campaignName}
                            </span>
                        </div>
                    )
                    )}
                </div>
            </div>
        );

        setTooltip({
            visible: true,
            content: tooltipContent,
            x: e.clientX,
            y: e.clientY,
        });
    };

    const handleMouseOut = () => {
        tooltipTimeoutRef.current = setTimeout(() => {
            setTooltip(prev => ({ ...prev, visible: false }));
        }, 300);
    };

    const handleTooltipEnter = () => {
        clearTimeout(tooltipTimeoutRef.current);
    }

    return (
        <>
            <Card className="h-full w-full">
                <CardContent>
                    <div className="flex items-center w-full justify-between mb-3">
                        <div className="flex flex-wrap items-center text-xs sm:text-sm text-gray-600 gap-x-4 gap-y-1">
                            <span className="flex items-center gap-1.5 transition-all duration-300">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                                <span className="text-emerald-600 font-medium">Campaign Starting</span>
                            </span>
                            <span className="flex items-center gap-1.5 transition-all duration-300">
                                <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                                <span className="text-rose-600 font-medium">Campaign Ending</span>
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={p} className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-300 hover:scale-110">
                                <FiChevronLeft className="text-gray-500" />
                            </button>
                            <span className="font-semibold text-sm sm:text-base text-gray-800">
                                {currentDate.format('MMMM YYYY')}
                            </span>
                            <button onClick={n} className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-300 hover:scale-110">
                                <FiChevronRight className="text-gray-500" />
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 text-center text-sm font-medium text-gray-500 border-b border-gray-200">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="py-2 hover:bg-gray-100 transition-all duration-200">
                                {d}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 border-l border-gray-200">
                        {days.map((day, i) => {
                            const k = day.format('YYYY-MM-DD');
                            const e = events.get(k);
                            const cm = day.month() === currentDate.month();
                            const t = day.isSame(dayjs(), 'day');

                            return (
                                <div
                                    key={i}
                                    className={`h-24 border-b border-r border-gray-200 p-1 relative transition-all duration-300 hover:bg-gray-50 ${!cm ? 'bg-gray-50 text-gray-400' : 'text-black hover:shadow-inner'}`}
                                >
                                    <span
                                        className={`text-sm absolute top-1.5 right-1.5 transition-all duration-300 ${
                                            t ? 'bg-gray-800 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg' : ''
                                        }`}
                                    >
                                        {day.format('D')}
                                    </span>

                                    <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1">
                                        {e?.startingCampaigns?.length > 0 && (
                                            <div
                                                className="w-2 h-2 rounded-full bg-emerald-500 hover:scale-150 transition-transform duration-300"
                                                onMouseEnter={(event) => handleMouseOver(event, e.startingCampaigns, 'starting')}
                                                onMouseLeave={handleMouseOut}
                                            ></div>
                                        )}

                                        {e?.endingCampaigns?.length > 0 && (
                                            <div
                                                className="w-2 h-2 rounded-full bg-rose-500 hover:scale-150 transition-transform duration-300"
                                                onMouseEnter={(event) => handleMouseOver(event, e.endingCampaigns, 'ending')}
                                                onMouseLeave={handleMouseOut}
                                            ></div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {tooltip.visible && (
                <div
                    className="fixed z-50 bg-gray-900 text-white text-xs rounded-xl px-3 py-2 shadow-2xl transform transition-all duration-300 scale-105"
                    style={{
                        top: `${tooltip.y + 15}px`,
                        left: `${tooltip.x + 15}px`,
                    }}
                    onMouseEnter={handleTooltipEnter}
                    onMouseLeave={handleMouseOut}
                >
                    {tooltip.content}
                </div>
            )}
        </>
    );
};

const BookingGraphDashboard = () => {
    const { isCollapsed } = useSidebar();
    const [bookingStats, setBookingStats] = useState([]);
    const [proposals, setProposals] = useState([]);
    const [range, setRange] = useState('month');
    const [campaigns, setCampaigns] = useState([]);
    const [currentDate, setCurrentDate] = useState(dayjs());
    const [bookingsAndProposalsData, setBookingsAndProposalsData] = useState({
        xLabels: [],
        bookingsData: [],
        proposalsData: []
    });
    const [statusData, setStatusData] = useState({
        completed: 0,
        ongoing: 0,
        upcoming: 0,
    });
    const [loading, setLoading] = useState(true);
    const [doohAvailabilityStatus, setDoohAvailabilityStatus] = useState({
        completelyAvailable: 0,
        partiallyAvailable: 0,
        completelyBooked: 0,
    });

    const [ownershipDistribution, setOwnershipDistribution] = useState({
        traded: 0,
        owned: 0,
        leased: 0,
    });

    const [revenueView, setRevenueView] = useState('monthly');
    const [revenueChartData, setRevenueChartData] = useState({ xLabels: [], yData: [] });

    const [paymentData, setPaymentData] = useState({ received: 0, due: 0 });
    const navigate = useNavigate();

    const [unitUtilizationStats, setUnitUtilizationStats] = useState({
        bookedUnits: 0,
        freeUnits: 0,
    });

    const [availabilityStats, setAvailabilityStats] = useState({
        available: 0,
        booked: 0,
        overlapping: 0,
    });

    const { auth } = useAuth();

    const [tableBookings, setTableBookings] = useState([]);

    const getCampaignStatus = (startDate, endDate) => {
        const today = moment();
        const start = moment(startDate).startOf('day');
        const end = moment(endDate).endOf('day');

        if (!start.isValid() || !end.isValid()) {
            return 'invalid';
        }

        if (today.isBefore(start)) {
            return 'upcoming';
        }
        if (today.isBetween(start, end)) {
            return 'ongoing';
        }
        return 'completed';
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/campaigns`);
                const data = await response.json();
                if (data && data.campaigns) {
                    setCampaigns(data.campaigns);
                    const statusCounts = data.campaigns.reduce(
                        (acc, campaign) => {
                            const status = getCampaignStatus(campaign.startDate, campaign.endDate);
                            if (acc[status] !== undefined) {
                                acc[status]++;
                            }
                            return acc;
                        },
                        { completed: 0, ongoing: 0, upcoming: 0 }
                    );
                    setStatusData(statusCounts);
                }
            } catch (err) {
                console.error('Error fetching campaigns:', err);
            }
        };
        fetchCampaigns();
    }, []);

    useEffect(() => {
        if (bookingStats.length > 0) {
            const now = dayjs();
            const rangeStart = getRangeStart(now);

            const filteredBookings = bookingStats.filter(b => {
                if (!b.createdAt) return false;
                const createdDate = dayjs(b.createdAt);
                return createdDate.isValid() && createdDate.isAfter(rangeStart);
            });

            let totalReceived = 0;
            let totalDue = 0;
            filteredBookings.forEach((b) => {
                totalReceived += b.totalPaid || 0;
                totalDue += b.paymentDue || 0;
            });
            setPaymentData({ received: totalReceived, due: totalDue });
        }
    }, [range, bookingStats]);

    useEffect(() => {
        if (bookingStats.length > 0) {
            processRevenueData(bookingStats);
        }
    }, [revenueView, bookingStats]);

    useEffect(() => {
        if (tableBookings.length > 0 || proposals.length > 0) {
            const now = dayjs();
            const rangeStart = getRangeStart(now);
            processBookingsAndProposalsData(rangeStart);
        }
    }, [range, tableBookings, proposals]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('accessToken');
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            };

            const [bookingRes, spaceRes, proposalRes] = await Promise.all([
                fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bookings/dashboard-stats`, { headers }),
                fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/dashboard-stats`, { headers }),
                fetch(`${import.meta.env.VITE_API_BASE_URL}/api/proposals`, { headers }),
            ]);

            const firstPageRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bookings/optimized?page=1&limit=50`, { headers });

            if (!firstPageRes.ok) {
                throw new Error(`Failed to fetch the first page of bookings: ${firstPageRes.statusText}`);
            }

            const firstPageData = await firstPageRes.json();
            const totalCount = firstPageData.totalCount || 0;
            const perPage = 50;
            const totalPages = Math.ceil(totalCount / perPage);
            let allBookings = firstPageData.bookings || [];

            if (totalPages > 1) {
                const pagePromises = [];
                for (let page = 2; page <= totalPages; page++) {
                    pagePromises.push(
                        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bookings/optimized?page=${page}&limit=${perPage}`, { headers })
                            .then(res => {
                                if (!res.ok) {
                                    console.error(`Failed to fetch page ${page}: ${res.statusText}`);
                                    return { bookings: [] };
                                }
                                return res.json();
                            })
                    );
                }
                const allPagesData = await Promise.all(pagePromises);
                const additionalBookings = allPagesData.flatMap(data => data.bookings || []);
                allBookings = [...allBookings, ...additionalBookings];
            }

            if ([bookingRes, spaceRes, proposalRes, firstPageRes].some(res => res.status === 403)) {
                localStorage.removeItem('accessToken');
                navigate('/login');
                return;
            }

            const bookingData = await bookingRes.json();
            const statsData = await spaceRes.json();
            const proposalData = await proposalRes.json();

            setBookingStats(bookingData.bookingStats || []);
            setProposals(proposalData || []);
            setUnitUtilizationStats(statsData.doohUtilization || {});
            setAvailabilityStats(statsData.staticAvailability || {});
            setDoohAvailabilityStatus(statsData.doohAvailabilityStatus || {});
            setOwnershipDistribution(statsData.ownershipDistribution || {});
            setTableBookings(allBookings);

        } catch (err) {
            console.error('Dashboard fetch failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const getRangeStart = (now) => {
        switch (range) {
            case 'week':
                return now.startOf('week');
            case 'threeMonths':
                return now.subtract(3, 'month').startOf('month');
            case 'month':
            default:
                return now.startOf('month');
        }
    };

    const processBookingsAndProposalsData = (rangeStart) => {
        const bookingMap = new Map();
        const proposalMap = new Map();

        tableBookings.forEach(({ createdAt }) => {
            const created = dayjs(createdAt);
            if (!created.isValid() || created.isBefore(rangeStart)) return;
            const key = created.format('YYYY-MM-DD');
            bookingMap.set(key, (bookingMap.get(key) || 0) + 1);
        });

        proposals.forEach(({ createdAt }) => {
            const created = dayjs(createdAt);
            if (!created.isValid() || created.isBefore(rangeStart)) return;
            const key = created.format('YYYY-MM-DD');
            proposalMap.set(key, (proposalMap.get(key) || 0) + 1);
        });

        const allKeys = new Set([...bookingMap.keys(), ...proposalMap.keys()]);
        const sortedKeys = Array.from(allKeys).sort((a, b) => dayjs(a).unix() - dayjs(b).unix());

        const xLabels = sortedKeys.map((key) => dayjs(key).format('DD MMM'));
        const bookingsData = sortedKeys.map((key) => bookingMap.get(key) || 0);
        const proposalsData = sortedKeys.map((key) => proposalMap.get(key) || 0);

        setBookingsAndProposalsData({ xLabels, bookingsData, proposalsData });
    };

    const processRevenueData = (bookingsToProcess) => {
        const revenueMap = new Map();

        bookingsToProcess.forEach(({ createdAt, totalPaid }) => {
            if (totalPaid === null || totalPaid === undefined) return;

            const createdDate = dayjs(createdAt);
            if (!createdDate.isValid()) return;

            const key = revenueView === 'monthly'
                ? createdDate.format('MMM YYYY')
                : createdDate.format('YYYY');

            revenueMap.set(key, (revenueMap.get(key) || 0) + totalPaid);
        });

        const sortedKeys = Array.from(revenueMap.keys()).sort((a, b) => {
            const format = revenueView === 'monthly' ? 'MMM YYYY' : 'YYYY';
            return dayjs(a, format).unix() - dayjs(b, format).unix();
        });

        let xLabels = sortedKeys;
        let yData = sortedKeys.map(k => revenueMap.get(k));

        if (xLabels.length === 1) {
            const singleDateLabel = xLabels[0];
            const format = revenueView === 'monthly' ? 'MMM YYYY' : 'YYYY';
            const periodUnit = revenueView === 'monthly' ? 'month' : 'year';

            const precedingDate = dayjs(singleDateLabel, format).subtract(1, periodUnit);
            const precedingLabel = precedingDate.format(format);

            xLabels = [precedingLabel, ...xLabels];
            yData = [0, ...yData];
        }

        setRevenueChartData({ xLabels, yData });
    };

    const getPipelineStatusCounts = () => {
        const counts = {
            bookingConfirmed: 0,
            artworkReceived: 0,
            printingStatus: 0,
            mountingStatus: 0,
            poReceived: 0,
            invoiceReceived: 0,
        };

        bookingStats.forEach((b) => {
            if (b.bookingConfirmed) counts.bookingConfirmed++;
            if (b.artworkReceived) counts.artworkReceived++;
            if (b.poReceived) counts.poReceived++;
            if (b.invoiceReceived) counts.invoiceReceived++;
            counts.printingStatus += b.printingStatus || 0;
            counts.mountingStatus += b.mountingStatus || 0;
        });

        return counts;
    };

    const pipelineCounts = getPipelineStatusCounts();

    const ownershipDistributionPieData = [
        { id: 0, value: ownershipDistribution.traded || 0.01, label: 'Traded', color: '#B2EBF2' }, // Light Cyan
        { id: 1, value: ownershipDistribution.owned || 0.01, label: 'Owned', color: '#FFD7A5' }, // Pale Gold
        { id: 2, value: ownershipDistribution.leased || 0.01, label: 'Leased', color: '#F2B6D4' }, // Pastel Pink
    ];

    const campaignStatusPieData = [
        { id: 0, value: statusData.completed, label: 'Completed', color: '#A5D6A7' }, // Soft Green
        { id: 1, value: statusData.ongoing, label: 'Ongoing', color: '#64B5F6' }, // Light Blue
        { id: 2, value: statusData.upcoming, label: 'Upcoming', color: '#FFD54F' }, // Light Amber
    ];

    const doohAvailabilityPieData = [
        { id: 0, value: doohAvailabilityStatus.completelyAvailable || 0.01, label: 'Available', color: '#AED581' }, // Muted Lime Green
        { id: 1, value: doohAvailabilityStatus.partiallyAvailable || 0.01, label: 'Partially', color: '#FFB74D' }, // Pastel Orange
        { id: 2, value: doohAvailabilityStatus.completelyBooked || 0.01, label: 'Booked', color: '#E57373' }, // Soft Red
    ];

    const unitUtilizationPieData = [
        { id: 0, value: unitUtilizationStats.bookedUnits || 0.01, label: 'Booked Units', color: '#90CAF9' }, // Light Blue
        { id: 1, value: unitUtilizationStats.freeUnits || 0.01, label: 'Free Units', color: '#A5D6A7' }, // Soft Green
    ];

    const availabilityPieData = [
        { id: 0, value: availabilityStats.available || 0.01, label: 'Available', color: '#C8E6C9' }, // Pale Green
        { id: 1, value: availabilityStats.booked || 0.01, label: 'Booked', color: '#F8BBD0' }, // Light Pink
        { id: 2, value: availabilityStats.overlapping || 0.01, label: 'Overlapping', color: '#FFCC80' }, // Pale Orange
    ];

    const paymentPieData = [
        { id: 0, value: paymentData.received || 0.01, label: 'Received', color: '#80CBC4' }, // Teal
        { id: 1, value: paymentData.due || 0.01, label: 'Due', color: '#FFAB91' } // Light Coral
    ];

    const pipelineBarData = {
        labels: ['Booking Confirmed', 'Artwork', 'Printing Status', 'PO', 'Mounting Status', 'Invoice'],
        values: [
            pipelineCounts.bookingConfirmed,
            pipelineCounts.artworkReceived,
            pipelineCounts.printingStatus,
            pipelineCounts.poReceived,
            pipelineCounts.mountingStatus,
            pipelineCounts.invoiceReceived,
        ],
    };

    return (
        <div className="min-h-screen h-screen w-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-black flex flex-col">
            <Navbar />
            <main className={`flex-1 h-full overflow-y-auto px-3 md:px-4 py-4 transition-all duration-500 ease-in-out ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
                <div className="flex flex-col md:flex-row mb-4 gap-4 items-center">
                    <h2 className="text-2xl font-sans font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Dashboard
                    </h2>
                    <p className="text-lg font-medium text-gray-700 ml-auto bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-transparent">
                        Welcome, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">{auth.userName}</span>
                    </p>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-4">
                                <ShimmerCard className='h-60' />
                                <ShimmerCard className='h-60' />
                            </div>
                            <div className="lg:col-span-2">
                                <ShimmerCard className='h-full min-h-[500px]' />
                            </div>
                            <ShimmerCard />
                            <ShimmerCard />
                            <ShimmerCard />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-4">
                                <Card className="h-60">
                                    <CardContent>
                                        <div className="flex justify-between items-start mb-2">
                                            <h2 className="text-base font-bold text-gray-800">Campaign Status</h2>
                                            <div className="text-xs text-right text-gray-600 space-y-1">
                                                <p className="flex items-center gap-1">
                                                    <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                                    <strong>Completed:</strong> <span className="text-green-600 font-bold">{statusData.completed}</span>
                                                </p>
                                                <p className="flex items-center gap-1">
                                                    <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                                    <strong>Ongoing:</strong> <span className="text-blue-600 font-bold">{statusData.ongoing}</span>
                                                </p>
                                                <p className="flex items-center gap-1">
                                                    <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                                                    <strong>Upcoming:</strong> <span className="text-yellow-600 font-bold">{statusData.upcoming}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex-grow -mx-4 flex items-center justify-center">
                                            <PieChart
                                                series={[{
                                                    data: campaignStatusPieData,
                                                    innerRadius: 40,
                                                    highlightScope: { faded: 'global', highlighted: 'item' },
                                                    faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                                                }]}
                                                legend={{ hidden: true }}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="h-60">
                                    <CardContent>
                                        <div className="flex justify-between items-start mb-2">
                                            <h2 className="text-base font-bold text-gray-800">Ownership Distribution</h2>
                                            <div className="text-xs text-right text-gray-600 space-y-1">
                                                <p className="flex items-center gap-1">
                                                    <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                                                    <strong>Traded:</strong> <span className="text-cyan-600 font-bold">{ownershipDistribution.traded}</span>
                                                </p>
                                                <p className="flex items-center gap-1">
                                                    <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                                                    <strong>Owned:</strong> <span className="text-yellow-600 font-bold">{ownershipDistribution.owned}</span>
                                                </p>
                                                <p className="flex items-center gap-1">
                                                    <span className="w-2 h-2 bg-pink-400 rounded-full"></span>
                                                    <strong>Leased:</strong> <span className="text-pink-600 font-bold">{ownershipDistribution.leased}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex-grow -mx-4 flex items-center justify-center">
                                            <PieChart
                                                series={[{
                                                    data: ownershipDistributionPieData,
                                                    innerRadius: 40,
                                                    highlightScope: { faded: 'global', highlighted: 'item' },
                                                    faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                                                }]}
                                                legend={{ hidden: true }}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="lg:col-span-2">
                                <DashboardCalendar campaigns={campaigns} currentDate={currentDate} setCurrentDate={setCurrentDate} />
                            </div>

                            <Card className="h-60">
                                <CardContent>
                                    <div className="flex justify-between items-start mb-2">
                                        <h2 className="text-base font-bold text-gray-800">DOOH Availability</h2>
                                        <div className="text-xs text-right text-gray-600 space-y-1">
                                            <p className="flex items-center gap-1">
                                                <span className="w-2 h-2 bg-lime-400 rounded-full"></span>
                                                <strong>Available:</strong> <span className="text-lime-600 font-bold">{doohAvailabilityStatus.completelyAvailable}</span>
                                            </p>
                                            <p className="flex items-center gap-1">
                                                <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                                                <strong>Partially:</strong> <span className="text-orange-600 font-bold">{doohAvailabilityStatus.partiallyAvailable}</span>
                                            </p>
                                            <p className="flex items-center gap-1">
                                                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                                                <strong>Booked:</strong> <span className="text-red-600 font-bold">{doohAvailabilityStatus.completelyBooked}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex-grow -mx-4 flex items-center justify-center">
                                        <PieChart
                                            series={[{
                                                data: doohAvailabilityPieData,
                                                innerRadius: 40,
                                                highlightScope: { faded: 'global', highlighted: 'item' },
                                                faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                                            }]}
                                            legend={{ hidden: true }}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="h-60">
                                <CardContent>
                                    <div className="flex justify-between items-start mb-2">
                                        <h2 className="text-base font-bold text-gray-800">DOOH Unit Utilization</h2>
                                        <div className="text-xs text-right text-gray-600 space-y-1">
                                            <p className="flex items-center gap-1">
                                                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                                <strong>Booked:</strong> <span className="text-blue-600 font-bold">{unitUtilizationStats.bookedUnits}</span>
                                            </p>
                                            <p className="flex items-center gap-1">
                                                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                                <strong>Free:</strong> <span className="text-green-600 font-bold">{unitUtilizationStats.freeUnits}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex-grow -mx-4 flex items-center justify-center">
                                        <PieChart
                                            series={[{
                                                data: unitUtilizationPieData,
                                                innerRadius: 40,
                                                highlightScope: { faded: 'global', highlighted: 'item' },
                                                faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                                            }]}
                                            legend={{ hidden: true }}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="h-60">
                                <CardContent>
                                    <div className="flex justify-between items-start mb-2">
                                        <h2 className="text-base font-bold text-gray-800">Static Space Availability</h2>
                                        <div className="text-xs text-right text-gray-600 space-y-1">
                                            <p className="flex items-center gap-1">
                                                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                                <strong>Available:</strong> <span className="text-green-600 font-bold">{availabilityStats.available}</span>
                                            </p>
                                            <p className="flex items-center gap-1">
                                                <span className="w-2 h-2 bg-pink-400 rounded-full"></span>
                                                <strong>Booked:</strong> <span className="text-pink-600 font-bold">{availabilityStats.booked}</span>
                                            </p>
                                            <p className="flex items-center gap-1">
                                                <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                                                <strong>Overlapping:</strong> <span className="text-orange-600 font-bold">{availabilityStats.overlapping}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex-grow -mx-4 flex items-center justify-center">
                                        <PieChart
                                            series={[{
                                                data: availabilityPieData,
                                                innerRadius: 40,
                                                highlightScope: { faded: 'global', highlighted: 'item' },
                                                faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                                            }]}
                                            legend={{ hidden: true }}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex justify-end">
                            <select
                                className="border border-gray-300 text-gray-700 px-3 py-2 rounded-xl text-sm shadow-md cursor-pointer hover:bg-gray-100 transition-all duration-300"
                                value={range}
                                onChange={(e) => setRange(e.target.value)}
                            >
                                <option value="week" className="bg-white text-gray-800">This Week</option>
                                <option value="month" className="bg-white text-gray-800">This Month</option>
                                <option value="threeMonths" className="bg-white text-gray-800">Last 3 Months</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-6 auto-rows-fr gap-4">

                            <div className="lg:col-span-4">
                                <Card className="h-80">
                                    <CardContent>
                                        <div className="flex justify-between items-center mb-3">
                                            <h2 className="text-base font-bold text-gray-800">Bookings and Open Proposals</h2>
                                        </div>
                                        <div className="flex flex-grow -mx-4">
                                            <BarChart
                                                xAxis={[{ scaleType: 'band', data: bookingsAndProposalsData.xLabels, categoryGapRatio: 0.4 }]}
                                                series={[
                                                    { data: bookingsAndProposalsData.bookingsData, label: 'Bookings', color: '#A5D6A7' },
                                                    { data: bookingsAndProposalsData.proposalsData, label: 'Open Proposals', color: '#64B5F6' }
                                                ]}
                                                borderRadius={8}
                                                legend={{
                                                    direction: 'row',
                                                    position: { vertical: 'top', horizontal: 'right' },
                                                }}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="lg:col-span-2">
                                <Card className="h-80">
                                    <CardContent>
                                        <div className="flex justify-between items-start mb-3">
                                            <h2 className="text-base font-bold text-gray-800">Payment Overview</h2>
                                            <div className="text-right">
                                                <div className="text-xs text-gray-600 space-y-1">
                                                    <p className="flex items-center justify-end gap-1">
                                                        <span className="w-2 h-2 bg-teal-400 rounded-full"></span>
                                                        <strong>Received:</strong> <span className="text-teal-600 font-bold">₹{paymentData.received.toLocaleString()}</span>
                                                    </p>
                                                    <p className="flex items-center justify-end gap-1">
                                                        <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                                                        <strong>Due:</strong> <span className="text-orange-600 font-bold">₹{paymentData.due.toLocaleString()}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-grow -mx-4 items-center justify-center">
                                            <PieChart
                                                series={[{
                                                    data: paymentPieData,
                                                    innerRadius: 40,
                                                    highlightScope: { faded: 'global', highlighted: 'item' },
                                                    faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                                                }]}
                                                legend={{
                                                    direction: 'column',
                                                    position: { vertical: 'middle', horizontal: 'right' },
                                                    padding: 0,
                                                }}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="lg:col-span-3">
                                <Card className="h-80">
                                    <CardContent>
                                        <div className="flex justify-between items-center mb-3">
                                            <h2 className="text-base font-bold text-gray-800">Campaign Status Overview</h2>
                                        </div>
                                        <div className="flex flex-grow -mx-4">
                                            <BarChart
                                                xAxis={[{ scaleType: 'band', data: pipelineBarData.labels, categoryGapRatio: 0.6 }]}
                                                series={[{ data: pipelineBarData.values, label: 'Campaign Count', color: '#F2B6D4' }]}
                                                borderRadius={8}
                                                legend={{
                                                    direction: 'row',
                                                    position: { vertical: 'top', horizontal: 'right' },
                                                }}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="lg:col-span-3">
                                <Card className="h-80">
                                    <CardContent>
                                        <div className="flex justify-between items-center mb-2">
                                            <h2 className="text-base font-bold text-gray-800">Revenue Graph</h2>
                                            <button
                                                onClick={() => setRevenueView(prev => prev === 'yearly' ? 'monthly' : 'yearly')}
                                                className="bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-lg shadow-md hover:bg-gray-300 transition-all duration-300 font-medium"
                                            >
                                                View By: {revenueView === 'yearly' ? 'Yearly' : 'Monthly'}
                                            </button>
                                        </div>
                                        <div className='flex flex-grow -ml-4 -mr-2'>
                                            {(() => {
                                                const yMax = revenueChartData.yData.length > 0 ? Math.max(...revenueChartData.yData) : 0;
                                                const yAxisFormatter = (value) => `${(value / 100000).toFixed(1)} L`;
                                                const tooltipFormatter = (value) => `₹${(value / 100000).toFixed(2)} L`;
                                                return (
                                                    <LineChart
                                                        xAxis={[{ data: revenueChartData.xLabels, scaleType: 'point' }]}
                                                        yAxis={[{ label: 'Amount in Lakhs', min: 0, max: yMax > 0 ? yMax * 1.2 : 100000, valueFormatter: yAxisFormatter }]}
                                                        series={[{
                                                            data: revenueChartData.yData,
                                                            label: 'Revenue',
                                                            color: '#64B5F6',
                                                            showMark: true,
                                                            valueFormatter: tooltipFormatter,
                                                            area: true
                                                        }]}
                                                        grid={{ vertical: true, horizontal: true }}
                                                        margin={{ top: 40, right: 20, bottom: 50, left: 60 }}
                                                        legend={{
                                                            direction: 'row',
                                                            position: { vertical: 'top', horizontal: 'middle' },
                                                            padding: 0,
                                                        }}
                                                    />
                                                );
                                            })()}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <style jsx>{`
                @keyframes shimmer-flow {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }

                .animate-shimmer-flow {
                    animation: shimmer-flow 2s infinite;
                }
            `}</style>
        </div>
    );
};

export default BookingGraphDashboard;