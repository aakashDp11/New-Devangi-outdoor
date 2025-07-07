
import dayjs from 'dayjs';
import Navbar from './Navbar';
import { useState, useEffect } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LineChart } from '@mui/x-charts/LineChart';
import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
} from 'react-icons/fi';


import moment from 'moment';
const Card = ({ children, className = '', ...props }) => (
  <div className={`bg-white border shadow-sm rounded-xl w-full ${className}`} {...props}>
    {children}
  </div>
);

const Button = ({ children, className = '', ...props }) => (
  <button className={`px-4 py-2 rounded bg-black text-white hover: transition ${className}`} {...props}>
    {children}
  </button>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

const ShimmerCard = () => (
  <div className="bg-gray-200 animate-pulse rounded-xl w-full h-[400px] max-w-[500px]" />
);
const DashboardCalendar = ({campaigns, currentDate, setCurrentDate }) => {
  const [days, setDays] = useState([]);
  const [events, setEvents] = useState(new Map());
  // const [campaigns, setCampaigns] = useState([]);  
  const [tooltip, setTooltip] = useState({
    visible: false,
    content: '',
    x: 0,
    y: 0,
  });

  const navigate = useNavigate();

 
  useEffect(() => {
    const eventMap = new Map();
  
    if (Array.isArray(campaigns)) {
      console.log("Campaigns data is", campaigns);
  
      campaigns.forEach(campaign => {
        // Build the campaign info for each campaign
        const campaignInfo = {
          id: campaign._id,
          campaignName: campaign.campaignName || 'Unnamed Campaign',
        };
  
        // Process campaigns starting on a day
        if (campaign.startDate) {
          const startDateStr = dayjs(campaign.startDate).format('YYYY-MM-DD');
          // console.log(`Processing campaign: ${campaign.campaignName}, startDate: ${startDateStr}`);
  
          const dayEvents = eventMap.get(startDateStr) || { startingCampaigns: [], endingCampaigns: [] };
          dayEvents.startingCampaigns.push(campaignInfo);
          eventMap.set(startDateStr, dayEvents);
        }
  
        // Process campaigns ending on a day
        if (campaign.endDate) {
          const endDateStr = dayjs(campaign.endDate).format('YYYY-MM-DD');
          // console.log(`Processing campaign: ${campaign.campaignName}, endDate: ${endDateStr}`);
  
          const dayEvents = eventMap.get(endDateStr) || { startingCampaigns: [], endingCampaigns: [] };
          dayEvents.endingCampaigns.push(campaignInfo);
          eventMap.set(endDateStr, dayEvents);
        }
      });
    }
  
    setEvents(eventMap);  // Update the events map
  }, [campaigns]);  // This effect will run whenever 'campaigns' changes


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

  // Navigate to the previous and next month
  const p = () => setCurrentDate(currentDate.subtract(1, 'month'));
  const n = () => setCurrentDate(currentDate.add(1, 'month'));

  // Navigate to the campaign details page
  const handleNavigate = (bookingId) => {
    console.log("CLicked outside");
    if (bookingId) {
      console.log("CLicked");
      navigate(`/campaign-details/${bookingId}`);
    }
  };

  
  const handleMouseOver = (e, campaigns) => {
    if (!campaigns || campaigns.length === 0) return;
  
    const tooltipContent = (
      <div className="space-y-1">
        {campaigns.map((campaign, index) => {
          console.log("Campaign onclick is", campaign); // Ensure the campaign object is logged
          return (
            <div
              key={index}
              className="cursor-pointer text-sm text-white "
              onClick={() => {
                console.log("Navigating to campaign:", campaign.id); // Check if this is triggered
                handleNavigate(campaign.id); // Navigate to campaign details
              }}
            >
              {campaign.campaignName}
            </div>
          );
        })}
      </div>
    );
  
    // Log the tooltip content directly before setting it
    console.log("Tooltip Content before set:", tooltipContent);
  
    // Set the tooltip state
    setTooltip({
      visible: true,
      content: tooltipContent,
      x: e.clientX,
      y: e.clientY,
    });
  };
  
  

  // Hide tooltip
  const handleMouseOut = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  
  return (
    <>
      <Card className="h-full w-full">
        <CardContent>
          <div className="flex items-center w-full justify-between mb-4">
            <div className="flex flex-wrap items-center text-xs sm:text-sm text-gray-500 gap-x-4 gap-y-1">
              <span className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div> Campaign Starting
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> Campaign Ending
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={p} className="p-1 rounded-md hover:bg-gray-100">
                <FiChevronLeft />
              </button>
              <span className="font-semibold text-sm sm:text-base">{currentDate.format('MMMM YYYY')}</span>
              <button onClick={n} className="p-1 rounded-md hover:bg-gray-100">
                <FiChevronRight />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 text-center text-sm font-medium text-gray-500 border-b">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 border-l">
            {days.map((day, i) => {
              const k = day.format('YYYY-MM-DD');  // Get the formatted date for each day
              const e = events.get(k); // Get the events for this day
              const cm = day.month() === currentDate.month();  // Check if the day is in the current month
              const t = day.isSame(dayjs(), 'day');  // Check if the day is today
  
              // console.log(`Checking events for date: ${k}`, e);  // Log to check the events for each day
  
              return (
                <div
                // onMouseLeave={handleMouseOut}
                  key={i}
                  className={`h-24 border-b border-r p-1 relative ${!cm ? 'bg-gray-50 text-gray-400' : 'text-black'}`}
                >
                  <span
                    className={`text-sm absolute top-1.5 right-1.5 ${
                      t ? 'bg-blue-500 text-white rounded-full h-6 w-6 flex items-center justify-center' : ''
                    }`}
                  >
                    {day.format('D')}
                  </span>
  
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1">
                    {e?.startingCampaigns?.length > 0 && (
                      <div
                        className="w-2 h-2 rounded-full bg-green-500 cursor-pointer"
                        onMouseEnter={(event) => handleMouseOver(event, e.startingCampaigns)}
                        // onMouseLeave={handleMouseOut}
                        onClick={() => handleNavigate(e.startingCampaigns[0].id)}  // Navigate to the first campaign
                      ></div>
                    )}
  
                    {e?.endingCampaigns?.length > 0 && (
                      <div
                        className="w-2 h-2 rounded-full bg-red-500 cursor-pointer"
                        onMouseEnter={(event) => handleMouseOver(event, e.endingCampaigns)}
                        // onMouseLeave={handleMouseOut}
                        onClick={() => handleNavigate(e.endingCampaigns[0].id)}  // Navigate to the first campaign
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
    className="fixed z-50 bg-gray-800 text-white text-xs rounded-md px-2 py-1 shadow-lg"
    style={{
      top: `${tooltip.y + 15}px`,
      left: `${tooltip.x + 15}px`,  // Adjust position of the tooltip
    }}
  >
    {tooltip.content} {/* Tooltip content */}
  </div>
)}

    </>
  );
  
  
  
};
const BookingGraphDashboard = () => {
  const [bookingStats, setBookingStats] = useState([]);
  const [range, setRange] = useState('month');
  const [campaigns, setCampaigns] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [muiBookingData, setMuiBookingData] = useState({ xLabels: [], yData: [] });
  const [muiProposalData, setMuiProposalData] = useState({ xLabels: [], yData: [] });
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
  const [industryDistribution, setIndustryDistribution] = useState({});

  const [ownershipDistribution, setOwnershipDistribution] = useState({
    traded: 0,
    owned: 0,
    leased: 0,
  });
  

const [revenueView, setRevenueView] = useState('monthly');
const [revenueChartData, setRevenueChartData] = useState({ xLabels: [], yData: [] });

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

  const { auth, logout } = useAuth();

  const getCampaignStatus = (startDate, endDate) => {
    const currentDate = moment(); // Current date and time using moment
  
    const start = moment(startDate); // Parse startDate with moment
    const end = moment(endDate); // Parse endDate with moment
  

  
    // Check if the start and end dates are valid
    if (!start.isValid() || !end.isValid()) {
      console.error('Invalid date(s) detected:', { startDate, endDate });
      return 'invalid'; // Return 'invalid' if the date is invalid
    }
  
    // Compare current date with start and end dates
    if (currentDate.isBefore(start)) {
      return 'upcoming'; // Campaign is upcoming
    }
    if (currentDate.isBetween(start, end, null, '[]')) {
      return 'ongoing'; // Campaign is ongoing
    }
    return 'completed'; // Campaign is completed
  };
  
  
  
  
  useEffect(() => {
    fetchData();
  }, []);
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/campaigns`);
        const data = await response.json();
        console.log("Fetched campaigns data:", data);
        setCampaigns(data.campaigns);
        const statusCounts = data.campaigns.reduce(
          (acc, campaign) => {
            const status = getCampaignStatus(campaign.startDate, campaign.endDate);
            acc[status]++;
            return acc;
          },
          { completed: 0, ongoing: 0, upcoming: 0 }
        );
        setStatusData(statusCounts);
      } catch (err) {
        console.error('Error fetching campaigns:', err);
      }
    };
    fetchCampaigns();
  }, []); 
  useEffect(() => {
    if (bookingStats.length) {
      processBookingData();
      processProposalData(); // use same data for proposal chart if needed
      processRevenueData();
    }
  }, [range, bookingStats]);

  const fetchData = async () => {
     
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      const [bookingRes, spaceRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bookings/dashboard-stats`, { headers }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/dashboard-stats`, { headers }),
      ]);

      if (bookingRes.status === 403 || spaceRes.status === 403) {
        localStorage.removeItem('accessToken');
        navigate('/login');
        return;
      }

      const bookingData = await bookingRes.json();
      console.log("Booking data is",bookingData);
      const statsData = await spaceRes.json();

      setBookingStats(bookingData.bookingStats || []);
      setUnitUtilizationStats(statsData.doohUtilization || {});
      setAvailabilityStats(statsData.staticAvailability || {});
      setDoohAvailabilityStatus(statsData.doohAvailabilityStatus || {});
      setIndustryDistribution(bookingData.industryDistribution || {});

setOwnershipDistribution(statsData.ownershipDistribution || {});

    } catch (err) {
      console.error('Dashboard fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRangeStart = (now) => {
    const weekStart = now.startOf('week');
    const monthStart = now.startOf('month');
    const threeMonthsAgo = now.subtract(3, 'month').startOf('month');
    return range === 'week' ? weekStart : range === 'month' ? monthStart : threeMonthsAgo;
  };

  const processBookingData = () => {
    const now = dayjs();
    const rangeStart = getRangeStart(now);
    const dataMap = new Map();

    bookingStats.forEach(({ createdAt }) => {
      const created = dayjs(createdAt);
      if (!created.isValid() || created.isBefore(rangeStart)) return;
      const key = created.format('YYYY-MM-DD');
      dataMap.set(key, (dataMap.get(key) || 0) + 1);
    });

    const sortedKeys = Array.from(dataMap.keys()).sort((a, b) => dayjs(a).unix() - dayjs(b).unix());
    const xLabels = sortedKeys.map((key) => dayjs(key).format('DD MMM'));
    const yData = sortedKeys.map((key) => dataMap.get(key));

    setMuiBookingData({ xLabels, yData });
  };

  const processProposalData = () => {
    // For demo purposes, this mimics booking chart
    setMuiProposalData(muiBookingData);
  };

 
  
  const getPaymentStats = () => {
    let totalReceived = 0;
    let totalDue = 0;
  
    bookingStats.forEach((b) => {
      const created = dayjs(b.createdAt);
      const rangeStart = getRangeStart(dayjs());  // apply same filter to payments
      if (!created.isValid() || created.isBefore(rangeStart)) return;  // Filter out older payments
  
      totalReceived += b.totalPaid || 0;
      totalDue += b.paymentDue || 0;
    });
  
    return { totalReceived, totalDue };
  };
  
  const processRevenueData = () => {
    const revenueMap = new Map();
  
    bookingStats.forEach(({ createdAt, totalPaid }) => {
      if (!createdAt || !totalPaid) return;
  
      const date = dayjs(createdAt);
      const key = revenueView === 'monthly'
        ? date.format('MMM YYYY')  // e.g., "Jun 2024"
        : date.format('YYYY');     // e.g., "2024"
  
      revenueMap.set(key, (revenueMap.get(key) || 0) + totalPaid);
    });
  
    const sortedKeys = Array.from(revenueMap.keys()).sort((a, b) => {
      const format = revenueView === 'monthly' ? 'MMM YYYY' : 'YYYY';
      return dayjs(a, format).unix() - dayjs(b, format).unix();
    });
  
    const xLabels = sortedKeys;
    const yData = sortedKeys.map(k => revenueMap.get(k));
  
    setRevenueChartData({ xLabels, yData });
  };
  
  const processAllStats = () => {
    const now = dayjs();
    const bStatus = { ongoing: 0, completed: 0, upcoming: 0 };
    allBookings.forEach(booking => {
        (booking.campaigns || []).forEach(campaign => {
            const s = dayjs(campaign.startDate);
            const e = dayjs(campaign.endDate);
            if (s.isValid() && e.isValid()) {
                if (now.isAfter(e, 'day')) {
                    bStatus.completed++;
                } else if (now.isBefore(s, 'day')) {
                    bStatus.upcoming++;
                } else {
                    bStatus.ongoing++;
                }
            }
        });
    });
    setBookingStatus(bStatus);

    const paymentStartDate = getStartDateForRange(paymentOverviewRange);
    const filteredBookingsForPayments = paymentStartDate
      ? allBookings.filter(booking => dayjs(booking.createdAt).isAfter(paymentStartDate))
      : allBookings;

    const totalPayments = filteredBookingsForPayments.reduce((acc, booking) => {
        const payment = booking.campaigns?.[0]?.pipeline?.payment;
        if (payment) {
            acc.totalReceived += payment.totalPaid || 0;
            acc.totalDue += payment.paymentDue || 0;
        }
        return acc;
    }, { totalReceived: 0, totalDue: 0 });
    setPaymentStats(totalPayments);
    
    const rStart = dayjs().subtract(range === 'week' ? 7 : range === 'month' ? 30 : 90, 'day').startOf('day');
    const processForBarChart = (items) => {
        const map = new Map();
        items.forEach(({ createdAt }) => {
            const date = dayjs(createdAt);
            if (date.isValid() && date.isAfter(rStart)) {
                const key = date.format('YYYY-MM-DD');
                map.set(key, (map.get(key) || 0) + 1);
            }
        });
        const sortedKeys = Array.from(map.keys()).sort((a, b) => dayjs(a).unix() - dayjs(b).unix());
        return {
            xLabels: sortedKeys.map(k => dayjs(k).format('DD MMM')),
            yData: sortedKeys.map(k => map.get(k))
        };
    };
    setMuiBookingData(processForBarChart(allBookings));
    setMuiProposalData(processForBarChart(proposals));
    
    const pipelineStartDate = getStartDateForRange(campaignStatusRange);
    const filteredBookingsForPipeline = allBookings.filter(booking => dayjs(booking.createdAt).isAfter(pipelineStartDate));

    const pCounts = filteredBookingsForPipeline.reduce((counts, booking) => {
        const pipeline = booking.campaigns?.[0]?.pipeline;
        if (pipeline) {
            if (pipeline.bookingStatus?.confirmed) counts.bookingConfirmed++;
            if (pipeline.artwork?.confirmed) counts.artworkReceived++;
            if (pipeline.po?.documentUrl) counts.poReceived++;
            if (pipeline.invoice?.invoiceNumber) counts.invoiceReceived++;
            booking.campaigns.forEach(c => {
                c.spaces?.forEach(s => {
                    if (s?.id?.printingStatus?.confirmed) counts.printingStatus++;
                    if (s?.id?.mountingStatus?.confirmed) counts.mountingStatus++;
                });
            });
        }
        return counts;
    }, { bookingConfirmed: 0, artworkReceived: 0, printingStatus: 0, mountingStatus: 0, poReceived: 0, invoiceReceived: 0 });
    setPipelineBarData({
        labels: ['Booking Confirmed', 'Artwork', 'Printing', 'Mounting', 'PO', 'Invoice'],
        values: [pCounts.bookingConfirmed, pCounts.artworkReceived, pCounts.printingStatus, pCounts.mountingStatus, pCounts.poReceived, pCounts.invoiceReceived]
    });
    
    const activeCampaigns = allBookings.flatMap(b => b.campaigns || []).filter(c => {
      const s = dayjs(c.startDate);
      const e = dayjs(c.endDate);
      return s.isValid() && e.isValid() && now.isBetween(s, e, null, '[]');
    });

    const bookedSpaceIds = new Set(activeCampaigns.flatMap(c => c.spaces.map(s => s.spaceId)));

    // --- MODIFIED LOGIC FOR DOOH AVAILABILITY ---
    const invStats = { fullVacant: 0, fullBooked: 0, partialBooked: 0 };
    allSpaces.forEach(space => {
      // We now check if the space *type* is DOOH first.
      if (space.spaceType === 'DOOH') {
          // Check if it has units to determine partial/full booking
          if (space.units && space.units.length > 0) {
              const totalUnits = space.units.length;
              const bookedUnitsCount = space.units.filter(unit => bookedSpaceIds.has(unit._id)).length;
              
              if (bookedUnitsCount === 0) {
                  invStats.fullVacant++;
              } else if (bookedUnitsCount === totalUnits) {
                  invStats.fullBooked++;
              } else {
                  invStats.partialBooked++;
              }
          } else {
              // If it's a DOOH space with no units, it is by definition Fully Vacant.
              invStats.fullVacant++;
          }
      }
    });
    
    setInventoryBookingStats({
      labels: ['Full Vacant', 'Full Booked', 'Partial Booked'],
      values: [invStats.fullVacant, invStats.fullBooked, invStats.partialBooked],
    });

    const ownershipCounts = allSpaces.reduce((acc, space) => {
      const ownership = space.ownership?.toLowerCase() || 'owned'; // Default to owned if undefined
      if (ownership === 'leased') {
          acc.leased++;
      } else if (ownership === 'traded') {
          acc.traded++;
      } else {
          acc.owned++;
      }
      return acc;
    }, { owned: 0, leased: 0, traded: 0 });

    setInventoryDistributionStats(ownershipCounts);

    const isYearly = revenueView === 'yearly';

    if (isYearly) {
      let startOfFY;
      const currentMonth = now.month();
      if (currentMonth >= 3) {
          startOfFY = dayjs().month(3).startOf('month');
      } else {
          startOfFY = dayjs().subtract(1, 'year').month(3).startOf('month');
      }
      const endOfFY = startOfFY.add(1, 'year').subtract(1, 'day');

      const fyMonths = [];
      for (let i = 0; i < 12; i++) {
          fyMonths.push(startOfFY.add(i, 'month').format('MMM'));
      }

      const revMap = new Map();
      fyMonths.forEach(month => revMap.set(month, 0));

      allBookings.forEach(booking => {
          const date = dayjs(booking.createdAt);
          if (date.isBetween(startOfFY, endOfFY, null, '[]')) {
              const key = date.format('MMM');
              const paidAmount = booking.campaigns?.reduce((sum, c) => sum + (c.pipeline?.payment?.totalPaid || 0), 0) || 0;
              if (revMap.has(key)) {
                  revMap.set(key, revMap.get(key) + paidAmount);
              }
          }
      });
      
      setRevenueChartData({ xLabels: Array.from(revMap.keys()), yData: Array.from(revMap.values()) });
    } else {
      const timeUnits = 30;
      const timePeriod = 'day';
      const timeFormat = 'D MMM';
      const startPeriod = now.subtract(timeUnits - 1, timePeriod).startOf(timePeriod);
      
      const revMap = new Map();
      const sortedLabels = [];
      for(let i = 29; i >= 0; i--) {
          sortedLabels.push(now.subtract(i, 'day').format(timeFormat))
      }
      sortedLabels.forEach(label => revMap.set(label, 0));

      allBookings.forEach(booking => {
          const date = dayjs(booking.createdAt);
          if (date.isAfter(startPeriod)) {
              const key = date.format(timeFormat);
              const paidAmount = booking.campaigns?.reduce((sum, c) => sum + (c.pipeline?.payment?.totalPaid || 0), 0) || 0;
              if (revMap.has(key)) {
                  revMap.set(key, revMap.get(key) + paidAmount);
              }
          }
      });
      setRevenueChartData({ xLabels: Array.from(revMap.keys()), yData: Array.from(revMap.values()) });
    }
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
  const processCombinedData = () => {
    const now = dayjs();
    const rangeStart = getRangeStart(now);
    const dataMap = new Map();
  
    // Process bookings
    bookingStats.forEach(({ createdAt }) => {
      const created = dayjs(createdAt);
      if (!created.isValid() || created.isBefore(rangeStart)) return;
      const key = created.format('YYYY-MM-DD');
      dataMap.set(key, { bookings: (dataMap.get(key)?.bookings || 0) + 1 });
    });
  
    // Process proposals
    proposals.forEach(({ createdAt }) => {
      const created = dayjs(createdAt);
      if (!created.isValid() || created.isBefore(rangeStart)) return;
      const key = created.format('YYYY-MM-DD');
      if (!dataMap.has(key)) {
        dataMap.set(key, { bookings: 0, proposals: 0 });
      }
      dataMap.set(key, { ...dataMap.get(key), proposals: (dataMap.get(key)?.proposals || 0) + 1 });
    });
  
    const sortedKeys = Array.from(dataMap.keys()).sort((a, b) => dayjs(a).unix() - dayjs(b).unix());
    const xLabels = sortedKeys.map((key) => dayjs(key).format('DD MMM'));
    const yBookingData = sortedKeys.map((key) => dataMap.get(key)?.bookings || 0);
    const yProposalData = sortedKeys.map((key) => dataMap.get(key)?.proposals || 0);
  
    setMuiBookingData({ xLabels, yData: yBookingData });
    setMuiProposalData({ xLabels, yData: yProposalData });
  };
  
  const { totalReceived, totalDue } = getPaymentStats();
  const pipelineCounts = getPipelineStatusCounts();

  const paymentPieData = [
    { id: 0, value: totalReceived || 0.01, label: 'Received' },
    { id: 1, value: totalDue || 0.01, label: 'Due' },
  ];

  const unitUtilizationPieData = [
    { id: 0, value: unitUtilizationStats.bookedUnits || 0.01, label: 'Booked Units' },
    { id: 1, value: unitUtilizationStats.freeUnits || 0.01, label: 'Free Units' },
  ];

  const availabilityPieData = [
    { id: 0, value: availabilityStats.available || 0.01, label: 'Available' },
    { id: 1, value: availabilityStats.booked || 0.01, label: 'Booked' },
    { id: 2, value: availabilityStats.overlapping || 0.01, label: 'Overlapping Booking' },
  ];

  const pipelineBarData = {
    labels: [
      'Booking Confirmed',
      'Artwork Received',
      'Printing Status',
      'Mounting Status',
      'PO',
      'Invoice',
    ],
    values: [
      pipelineCounts.bookingConfirmed,
      pipelineCounts.artworkReceived,
      pipelineCounts.printingStatus,
      pipelineCounts.mountingStatus,
      pipelineCounts.poReceived,
      pipelineCounts.invoiceReceived,
    ],
  };
  const doohAvailabilityPieData = [
    { id: 0, value: doohAvailabilityStatus.completelyAvailable || 0.01, label: 'Completely Available' },
    { id: 1, value: doohAvailabilityStatus.partiallyAvailable || 0.01, label: 'Partially Available' },
    { id: 2, value: doohAvailabilityStatus.completelyBooked || 0.01, label: 'Completely Booked' },
  ];
  
  const ownershipDistributionPieData = [
    { id: 0, value: ownershipDistribution.traded || 0.01, label: 'Traded' },
    { id: 1, value: ownershipDistribution.owned || 0.01, label: 'Owned' },
    { id: 2, value: ownershipDistribution.leased || 0.01, label: 'Leased' },
  ];
  
  return (
    <div className="min-h-screen h-screen w-screen bg-white text-black flex flex-col">
      <Navbar />
      <main className="flex-1 h-full overflow-y-auto px-4 md:px-6 py-6 ml-0 lg:ml-64">
        <div className="flex flex-col md:flex-row mb-4 gap-4">
          <h2 className="text-3xl font-sans md:text-3xl ml-[1%]">Dashboard</h2>
          <Button onClick={logout} className="text-xs ml-auto w-full md:w-auto hover:-translate-y-1 hover:scale-110 transition">
            Log Out
          </Button>
        </div>

        <div className="flex flex-row w-full gap-[5%] mt-6">
          {loading ? (
            <>
              <ShimmerCard />
              <ShimmerCard />
            </>
          ) : (
            <>
              {/* Payment Overview */}
       <div className='h-full'>
       <Card className="max-w-[320px] h-[30%] shadow-md mt-4">
  <CardContent>
    <h2 className="text-sm font-medium mb-2">Ownership Distribution</h2>
    <div className="w-full">
      <div className='flex mt-4'>
        <div className="ml-auto text-[0.7rem]">
          <p><strong>Traded:</strong> {ownershipDistribution.traded}</p>
          <p><strong>Owned:</strong> {ownershipDistribution.owned}</p>
          <p><strong>Leased:</strong> {ownershipDistribution.leased}</p>
        </div>
      </div>
      <PieChart series={[{ data: ownershipDistributionPieData, innerRadius: 40 }]} height={190} width={150} />
    </div>
  </CardContent>
</Card>
       <Card className="max-w-[320px] h-[30%] shadow-md mt-4">
  <CardContent>
    <h2 className="text-sm font-medium mb-2">Campaign Status</h2>
    <div className="w-full">
      <div className="flex mt-4">
        <div className="ml-auto text-[0.7rem]">
          <p><strong>Completed:</strong> {statusData.completed}</p>
          <p><strong>Ongoing:</strong> {statusData.ongoing}</p>
          <p><strong>Upcoming:</strong> {statusData.upcoming}</p>
        </div>
      </div>
      <PieChart
        series={[
          {
            data: [
              { id: 0, value: statusData.completed, label: 'Completed' },
              { id: 1, value: statusData.ongoing, label: 'Ongoing' },
              { id: 2, value: statusData.upcoming, label: 'Upcoming' },
            ],
            innerRadius: 40, // To create a donut chart
          },
        ]}
        height={190}
        width={150}
      />
    </div>
  </CardContent>
</Card>

        </div>       

<div className="flex-grow">{loading ? <ShimmerCard height="h-full min-h-[424px]" /> : <DashboardCalendar campaigns={campaigns} bookings={allBookings} currentDate={currentDate} setCurrentDate={setCurrentDate} />}</div>
         
            </>
          )}
        </div>
        <div className="flex flex-row w-full gap-[5%] mt-6">
          {/* DOOH Availability Breakdown */}
<Card className="max-w-[320px] h-[30%] shadow-md mt-4">
  <CardContent>
    <h2 className="text-sm font-medium mb-2">DOOH Availability</h2>
    <div className="w-full">
      <div className='flex mt-4'>
        <div className="ml-auto text-[0.7rem]">
          <p><strong>Completely Available:</strong> {doohAvailabilityStatus.completelyAvailable}</p>
          <p><strong>Partially Available:</strong> {doohAvailabilityStatus.partiallyAvailable}</p>
          <p><strong>Completely Booked:</strong> {doohAvailabilityStatus.completelyBooked}</p>
        </div>
      </div>
      <PieChart series={[{ data: doohAvailabilityPieData, innerRadius: 40 }]} height={190} width={150} />
    </div>
  </CardContent>
</Card>
<Card className="max-w-[275px] h-[30%] shadow-md mt-4">
                <CardContent>
                  <h2 className="text-sm font-medium mb-2">DOOH Unit Utilization</h2>
                  <div className="w-full">
                    <div className='flex mt-4'>
                      <div className="ml-auto text-[0.8rem]">
                        <p><strong>Booked Units:</strong> {unitUtilizationStats.bookedUnits}</p>
                        <p><strong>Free Units:</strong> {unitUtilizationStats.freeUnits}</p>
                      </div>
                    </div>
                    <PieChart series={[{ data: unitUtilizationPieData, innerRadius: 40 }]} height={200} width={150} />
                  </div>
                </CardContent>
              </Card>
              <Card className="max-w-[320px] h-[30%] shadow-md mt-4">
                <CardContent>
                  <h2 className="text-sm font-medium mb-2">Static Space Availability</h2>
                  <div className="w-full">
                    <div className='flex mt-4'>
                      <div className="ml-auto text-[0.7rem]">
                        <p><strong>Available:</strong> {availabilityStats.available}</p>
                        <p><strong>Booked:</strong> {availabilityStats.booked}</p>
                        <p><strong>Overlapping booking:</strong> {availabilityStats.overlapping}</p>
                      </div>
                    </div>
                    <PieChart series={[{ data: availabilityPieData, innerRadius: 40 }]} height={190} width={150} />
                  </div>
                </CardContent>
              </Card>



        </div>

        {!loading && (
          <div className="mt-14 flex flex-col w-full">
            <div className="flex mb-3 w-full">
              <select
                className="border ml-auto px-3 py-2 rounded text-xs bg-white shadow-sm"
                value={range}
                onChange={(e) => setRange(e.target.value)}
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="threeMonths">Last 3 Months</option>
              </select>
            </div>

            <div className="flex w-full gap-[10%] ">
            <Card className="w-full shadow-md">
  <CardContent>
    <h2 className="text-sm font-medium mb-2">Bookings & Open Proposals</h2>
    <div className="w-full h-[400px]">
      <BarChart
        xAxis={[{ scaleType: 'band', data: muiBookingData.xLabels, categoryGapRatio: 0.8, barGapRatio: 0.2 }]}
        series={[
          {
            data: muiBookingData.yData,
            label: 'Number of Bookings',
            color: '#4caf50', // Optional: color for bookings bars
          },
          {
            data: muiProposalData.yData,
            label: 'Number of Proposals',
            color: '#2196f3', // Optional: color for proposals bars
          },
        ]}
        height={400}
        borderRadius={10}
        slotProps={{ bar: { width: 30 } }}
      />
    </div>
  </CardContent>
</Card>
             
              <Card className="max-w-[270px] h-[30%] shadow-md mt-4">
                <CardContent>
                  <h2 className="text-sm font-medium mb-2">Payment Overview</h2>
                  <div className='flex mt-4'>
                    <div className='ml-auto text-[0.8rem]'>
                      <p><strong>Received:</strong> ₹{totalReceived.toLocaleString()}</p>
                      <p><strong>Due:</strong> ₹{totalDue.toLocaleString()}</p>
                    </div>
                  </div>
                  <PieChart series={[{ data: paymentPieData, innerRadius: 40 }]} height={200} width={150} />
                </CardContent>
              </Card>
            </div>

            {/* Campaign Status */}
            <div className='flex w-[80%] mt-[10%]'>
              <Card className="w-full shadow-md mt-4">
                <CardContent>
                  <h2 className="text-sm font-medium mb-2">Campaign Status Overview</h2>
                  <div className="w-full h-[400px]">
                    <BarChart
                      xAxis={[{ scaleType: 'band', data: pipelineBarData.labels, barGapRatio: 0.5, categoryGapRatio: 0.8 }]}
                      series={[{ data: pipelineBarData.values, label: 'Completed' }]}
                      height={400}
                      borderRadius={10}
                      slotProps={{ bar: { width: 30, cornerradius: 10 } }}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Revenue Graph */}
<div className="mt-8">
  <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
    <h2 className="text-lg font-semibold">Revenue Graph</h2>
    {!loading && (
      <button onClick={() => setRevenueView(prev => prev === 'yearly' ? 'monthly' : 'yearly')} className="bg-gray-200 text-black text-xs px-3 py-1.5 rounded-md mt-2 sm:mt-0">
        View By: {revenueView === 'yearly' ? 'Yearly' : 'Monthly'}
      </button>
    )}
  </div>
  {loading ? <ShimmerCard height="h-[350px]" /> : (
    (() => {
      const yMax = revenueChartData.yData.length > 0 ? Math.max(...revenueChartData.yData) : 0;
      const yAxisFormatter = (value) => `${(value / 100000).toFixed(1)} L`;
      const tooltipFormatter = (value) => `₹${(value / 100000).toFixed(2)} L`;

      return (
        <div className="bg-white border shadow-sm rounded-xl w-full">
          <LineChart
            xAxis={[{ data: revenueChartData.xLabels, scaleType: 'point', label: revenueView === 'yearly' ? 'Months' : '' }]}
            yAxis={[{ 
              label: 'Amount in Lakhs (₹)',
              min: 0,
              max: yMax > 0 ? yMax * 1.2 : 100000,
              valueFormatter: yAxisFormatter,
            }]}
            series={[{ 
              data: revenueChartData.yData, 
              label: 'Revenue', 
              color: '#8b5cf6', 
              area: true, 
              curve: "monotoneX", 
              showMark: true,
              valueFormatter: tooltipFormatter,
            }]}
            height={350}
            grid={{ vertical: true, horizontal: true }}
            legend={{ position: { vertical: 'top', horizontal: 'center' } }}
          />
        </div>
      );
    })()
  )}
</div>

          </div>
        )}
      </main>
    </div>
  );
};

export default BookingGraphDashboard;


