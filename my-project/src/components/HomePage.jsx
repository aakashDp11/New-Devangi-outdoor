
import dayjs from 'dayjs';
import Navbar from './Navbar';
import { useState, useEffect } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LineChart } from '@mui/x-charts/LineChart';
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

const BookingGraphDashboard = () => {
  const [bookingStats, setBookingStats] = useState([]);
  const [range, setRange] = useState('month');
  const [muiBookingData, setMuiBookingData] = useState({ xLabels: [], yData: [] });
  const [muiProposalData, setMuiProposalData] = useState({ xLabels: [], yData: [] });
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

  useEffect(() => {
    fetchData();
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

              {/* DOOH Unit Utilization */}
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

              {/* Static Space Availability */}
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

{/* Ownership Distribution */}
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
              {/* Booking Chart */}
              <Card className="w-full shadow-md">
                <CardContent>
                  <h2 className="text-sm font-medium mb-2">Bookings</h2>
                  <div className="w-full h-[400px]">
                    <BarChart
                      xAxis={[{ scaleType: 'band', data: muiBookingData.xLabels, categoryGapRatio: 0.8, barGapRatio: 0.2 }]}
                      series={[{ data: muiBookingData.yData, label: 'Number of Bookings' }]}
                      height={400}
                      borderRadius={10}
                      slotProps={{ bar: { width: 30 } }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Proposals Chart */}
              <Card className="w-full shadow-md">
                <CardContent>
                  <h2 className="text-sm font-medium mb-2">Proposals</h2>
                  <div className="w-full h-[400px]">
                    <BarChart
                      xAxis={[{ scaleType: 'band', data: muiProposalData.xLabels, categoryGapRatio: 0.9, barGapRatio: 0.2 }]}
                      series={[{ data: muiProposalData.yData, label: 'Number of Proposals' }]}
                      height={400}
                      borderRadius={10}
                      slotProps={{ bar: { width: 30 } }}
                    />
                  </div>
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
