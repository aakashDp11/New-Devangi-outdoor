

// import { Bar, Line, Pie } from 'react-chartjs-2';
// import dayjs from 'dayjs';
// import Navbar from './Navbar';
// import { useState, useEffect } from 'react';

// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   LineElement,
//   PointElement,
//   LineController,
//   BarController,
//   ArcElement,
//   Title,
//   Tooltip,
//   Legend,
// } from 'chart.js';

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   LineElement,
//   PointElement,
//   LineController,
//   BarController,
//   ArcElement,
//   Title,
//   Tooltip,
//   Legend
// );

// const Card = ({ children, className = '', ...props }) => (
//   <div className={`bg-white border shadow-sm rounded-xl w-full ${className}`} {...props}>
//     {children}
//   </div>
// );

// const CardContent = ({ children, className = '' }) => (
//   <div className={`p-4 ${className}`}>{children}</div>
// );

// const ShimmerCard = () => (
//   <div className="bg-gray-200 animate-pulse rounded-xl w-full h-[400px] max-w-[500px]" />
// );

// const BookingGraphDashboard = () => {
//   const [bookings, setBookings] = useState([]);
//   const [proposals, setProposals] = useState([]);
//   const [range, setRange] = useState('month');
//   const [graphData, setGraphData] = useState({ labels: [], datasets: [] });
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetchData();
//   }, []);

//   useEffect(() => {
//     if (bookings.length) processBookingData();
//   }, [range, bookings]);

//   const fetchData = async () => {
//     try {
//       setLoading(true);

//       const [bookingsRes, proposalsRes] = await Promise.all([
//         fetch('http://localhost:3000/api/bookings'),
//         fetch('http://localhost:3000/api/proposals'),
//       ]);

//       const [bookingsData, proposalsData] = await Promise.all([
//         bookingsRes.json(),
//         proposalsRes.json(),
//       ]);
// console.log("Booking data is",bookingsData);
// console.log("Proposal data is",proposalsData);
//       setBookings(bookingsData.bookings);
//       setProposals(proposalsData);
//     } catch (err) {
//       console.error('Failed to fetch data', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const processBookingData = () => {
//     const now = dayjs();
//     const rangeStart = getRangeStart(now);

//     const data = {};
//     console.log("Bookings data is",bookings);
//     bookings.forEach((b) => {
//       const createdAt = dayjs(b.createdAt);
//       if (!createdAt.isValid() || createdAt.isBefore(rangeStart)) return;
//       const label = createdAt.format('DD MMM');
//       data[label] = (data[label] || 0) + 1;
//     });

//     const labels = Object.keys(data).sort((a, b) =>
//       dayjs(a, 'DD MMM').unix() - dayjs(b, 'DD MMM').unix()
//     );

//     setGraphData({
//       labels,
//       datasets: [
//         {
//           label: 'Number of Bookings',
//           data: labels.map((l) => data[l]),
//           backgroundColor: 'rgba(0, 0, 0, 0.7)',
//           borderRadius: 8,
//           maxBarThickness: 40,
//           categoryPercentage: 0.6,
//           barPercentage: 0.5,
//         },
//       ],
//     });
//   };

//   const getRangeStart = (now) => {
//     const weekStart = now.startOf('week');
//     const monthStart = now.startOf('month');
//     const threeMonthsAgo = now.subtract(3, 'month').startOf('month');
//     return range === 'week' ? weekStart : range === 'month' ? monthStart : threeMonthsAgo;
//   };

//   const getProposalGraphData = () => {
//     const now = dayjs();
//     const rangeStart = getRangeStart(now);

//     const data = {};
//     proposals.forEach((p) => {
//       const createdAt = dayjs(p.createdAt);
//       if (!createdAt.isValid() || createdAt.isBefore(rangeStart)) return;
//       const label = createdAt.format('DD MMM');
//       data[label] = (data[label] || 0) + 1;
//     });

//     const labels = Object.keys(data).sort((a, b) =>
//       dayjs(a, 'DD MMM').unix() - dayjs(b, 'DD MMM').unix()
//     );

//     return {
//       labels,
//       datasets: [
//         {
//           label: 'Number of Proposals',
//           data: labels.map((l) => data[l]),
//           backgroundColor: 'rgba(249, 115, 22, 0.7)',
//           borderRadius: 8,
//           maxBarThickness: 40,
//           categoryPercentage: 0.6,
//           barPercentage: 0.5,
//         },
//       ],
//     };
//   };



//   const getPaymentStats = () => {
//   let totalReceived = 0;
//   let totalDue = 0;

//   bookings.forEach(b => {
//     b.campaigns?.forEach(campaign => {
//       const pipeline = campaign.pipeline;
//       if (pipeline && pipeline.payment) {
//         totalReceived += pipeline.payment.totalPaid || 0;
//         totalDue += pipeline.payment.paymentDue || 0;
//       }
//     });
//   });

//   return { totalReceived, totalDue };
// };

//   // const getPipelineStatusCounts = () => {
//   //   const counts = {
//   //     bookingConfirmed: 0,
//   //     artworkReceived: 0,
//   //     printingStatus: 0,
//   //     mountingStatus: 0,
//   //     advertisingLive: 0,
//   //   };

//   //   bookings.forEach(b => {
//   //     const pipeline = b.pipeline;
//   //     if (pipeline) {
//   //       if (pipeline.bookingStatus?.confirmed) counts.bookingConfirmed++;
//   //       if (pipeline.artwork?.confirmed) counts.artworkReceived++;
//   //       if (pipeline.printingStatus?.confirmed) counts.printingStatus++;
//   //       if (pipeline.mountingStatus?.confirmed) counts.mountingStatus++;
//   //       if (pipeline.advertisingLive?.started) counts.advertisingLive++;
//   //     }
//   //   });

//   //   return counts;
//   // };
// const getPipelineStatusCounts = () => {
//   const counts = {
//     bookingConfirmed: 0,
//     artworkReceived: 0,
//     printingStatus: 0,
//     mountingStatus: 0,
//     advertisingLive: 0,
//   };

//   bookings.forEach(b => {
//     b.campaigns?.forEach(campaign => {
//       const pipeline = campaign.pipeline;
//       if (pipeline) {
//         if (pipeline.bookingStatus?.confirmed) counts.bookingConfirmed++;
//         if (pipeline.artwork?.confirmed) counts.artworkReceived++;
//         if (pipeline.printingStatus?.confirmed) counts.printingStatus++;
//         if (pipeline.mountingStatus?.confirmed) counts.mountingStatus++;
//         if (pipeline.advertisingLive?.started) counts.advertisingLive++;
//       }
//     });
//   });

//   return counts;
// };

//   const { totalReceived, totalDue } = getPaymentStats();
//   const pipelineCounts = getPipelineStatusCounts();

//   const pieChartData = {
//     labels: ['Received', 'Due'],
//     datasets: [
//       {
//         data: [totalReceived, totalDue],
//         backgroundColor: ['rgba(34, 197, 94, 0.7)', 'rgba(239, 68, 68, 0.7)'],
//         // backgroundColor: ['rgba(249, 115, 22, 0.7)', 'rgba(0, 0, 0, 0.7)'],
//         borderWidth: 1,
//       },
//     ],
//   };

//   const pipelineChartData = {
//     labels: [
//       'Booking Confirmed',
//       'Artwork Received',
//       'Printing Status',
//       'Mounting Status',
//       'Advertisement Live',
//     ],
//     datasets: [
//       {
//         label: 'Completed',
//         data: [
//           pipelineCounts.bookingConfirmed,
//           pipelineCounts.artworkReceived,
//           pipelineCounts.printingStatus,
//           pipelineCounts.mountingStatus,
//           pipelineCounts.advertisingLive,
//         ],
//         backgroundColor: 'rgba(59, 130, 246, 0.7)',
//         borderRadius: 8,
//         barThickness: 20,
//       },
//     ],
//   };

//   return (
//     <div className="min-h-screen w-[102%] bg-white text-black flex flex-col lg:flex-row">
//       <Navbar />
//       <main className="flex-1 mt-4 overflow-y-auto px-4 md:px-8 py-6 ml-0 lg:ml-64">
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
//           <h1 className="text-3xl md:text-3xl ml-[1%] font-semibold">Dashboard</h1>
//           <select
//             className="border px-3 py-2 rounded text-sm bg-white shadow-sm"
//             value={range}
//             onChange={(e) => setRange(e.target.value)}
//           >
//             <option value="week">This Week</option>
//             <option value="month">This Month</option>
//             <option value="threeMonths">Last 3 Months</option>
//           </select>
//         </div>

//         <div className="flex flex-col lg:flex-row justify-center items-center gap-10 mt-[5%] flex-wrap">
//           {loading ? (
//             <>
//               <ShimmerCard />
//               <ShimmerCard />
//               <ShimmerCard />
//               <ShimmerCard />
//               <ShimmerCard />
//             </>
//           ) : (
//             <>
//             {/* Payment Pie Chart */}
          
//               {/* Bookings Bar Chart */}
//               <Card className="max-w-[500px] shadow-md">
//                 <CardContent>
//                   <h2 className="text-sm font-medium mb-2">Bookings</h2>
//                   <div className="w-full h-[400px]">
//                     <Bar data={graphData} options={chartOptions} />
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* Proposals Bar Chart */}
//               <Card className="max-w-[500px] shadow-md">
//                 <CardContent>
//                   <h2 className="text-sm font-medium mb-2">Proposals</h2>
//                   <div className="w-full h-[400px]">
//                     <Bar data={getProposalGraphData()} options={chartOptions} />
//                   </div>
//                 </CardContent>
//               </Card>
//               <Card className="max-w-[300px] shadow-md mt-4">
//                 <CardContent>
//                   <h2 className="text-sm font-medium mb-2">Payment Overview</h2>
//                   <div className="w-full h-[300px]">
//                     <Pie data={pieChartData} options={pieOptions} />
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* Pipeline Status Horizontal Bar Chart */}
//               <Card className="max-w-[600px] shadow-md mt-28">
//                 <CardContent>
//                   <h2 className="text-sm font-medium mb-2">Pipeline Status Overview</h2>
//                   <div className="w-full h-[400px]">
//                     <Bar data={pipelineChartData} options={pipelineOptions} />
//                   </div>
//                 </CardContent>
//               </Card>

              
//             </>
//           )}
//         </div>
//       </main>
//     </div>
//   );
// };

// // Reusable Chart Options
// const chartOptions = {
//   responsive: true,
//   maintainAspectRatio: false,
//   plugins: { legend: { display: true, position: 'top' } },
//   scales: {
//     y: { beginAtZero: true, suggestedMax: 10, ticks: { stepSize: 1 } },
//     x: {
//       ticks: { autoSkip: false, maxRotation: 45, minRotation: 20 },
//     },
//   },
// };

// const pieOptions = {
//   responsive: true,
//   plugins: {
//     legend: { display: true, position: 'top' },
//     tooltip: {
//       callbacks: {
//         label: function (context) {
//           const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
//           const percentage = ((context.parsed / total) * 100).toFixed(2);
//           return `${context.label}: ${context.parsed} (${percentage}%)`;
//         },
//       },
//     },
//   },
// };

// const pipelineOptions = {
//   indexAxis: 'y',
//   responsive: true,
//   maintainAspectRatio: false,
//   plugins: { legend: { display: false } },
//   scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } },
// };

// export default BookingGraphDashboard;

import { Bar, Line, Pie } from 'react-chartjs-2';
import dayjs from 'dayjs';
import Navbar from './Navbar';
import { useState, useEffect } from 'react';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  LineController,
  BarController,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  LineController,
  BarController,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Card = ({ children, className = '', ...props }) => (
  <div className={`bg-white border shadow-sm rounded-xl w-full ${className}`} {...props}>
    {children}
  </div>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

const ShimmerCard = () => (
  <div className="bg-gray-200 animate-pulse rounded-xl w-full h-[400px] max-w-[500px]" />
);

const BookingGraphDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [range, setRange] = useState('month');
  const [graphData, setGraphData] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (bookings.length) processBookingData();
  }, [range, bookings]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [bookingsRes, proposalsRes] = await Promise.all([
        fetch('http://localhost:3000/api/bookings'),
        fetch('http://localhost:3000/api/proposals'),
      ]);

      const [bookingsData, proposalsData] = await Promise.all([
        bookingsRes.json(),
        proposalsRes.json(),
      ]);

      setBookings(bookingsData.bookings);
      console.log(bookingsData.bookings);
      setProposals(proposalsData);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const processBookingData = () => {
    const now = dayjs();
    const rangeStart = getRangeStart(now);

    const data = {};
    bookings.forEach((b) => {
      const createdAt = dayjs(b.createdAt);
      if (!createdAt.isValid() || createdAt.isBefore(rangeStart)) return;
      const label = createdAt.format('DD MMM');
      data[label] = (data[label] || 0) + 1;
    });

    const labels = Object.keys(data).sort((a, b) =>
      dayjs(a, 'DD MMM').unix() - dayjs(b, 'DD MMM').unix()
    );

    setGraphData({
      labels,
      datasets: [
        {
          label: 'Number of Bookings',
          data: labels.map((l) => data[l]),
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          borderRadius: 8,
          maxBarThickness: 40,
          categoryPercentage: 0.6,
          barPercentage: 0.5,
        },
      ],
    });
  };

  const getRangeStart = (now) => {
    const weekStart = now.startOf('week');
    const monthStart = now.startOf('month');
    const threeMonthsAgo = now.subtract(3, 'month').startOf('month');
    return range === 'week' ? weekStart : range === 'month' ? monthStart : threeMonthsAgo;
  };

  const getProposalGraphData = () => {
    const now = dayjs();
    const rangeStart = getRangeStart(now);

    const data = {};
    proposals.forEach((p) => {
      const createdAt = dayjs(p.createdAt);
      if (!createdAt.isValid() || createdAt.isBefore(rangeStart)) return;
      const label = createdAt.format('DD MMM');
      data[label] = (data[label] || 0) + 1;
    });

    const labels = Object.keys(data).sort((a, b) =>
      dayjs(a, 'DD MMM').unix() - dayjs(b, 'DD MMM').unix()
    );

    return {
      labels,
      datasets: [
        {
          label: 'Number of Proposals',
          data: labels.map((l) => data[l]),
          backgroundColor: 'rgba(249, 115, 22, 0.7)',
          borderRadius: 8,
          maxBarThickness: 40,
          categoryPercentage: 0.6,
          barPercentage: 0.5,
        },
      ],
    };
  };

  const getPaymentStats = () => {
    let totalReceived = 0;
    let totalDue = 0;

    bookings.forEach((b) => {
      b.campaigns?.forEach((campaign) => {
        const pipeline = campaign.pipeline;
        if (pipeline && pipeline.payment) {
          totalReceived += pipeline.payment.totalPaid || 0;
          totalDue += pipeline.payment.paymentDue || 0;
        }
      });
    });

    return { totalReceived, totalDue };
  };

  const getPipelineStatusCounts = () => {
    const counts = {
      bookingConfirmed: 0,
      artworkReceived: 0,
      printingStatus: 0,
      mountingStatus: 0,
      advertisingLive: 0,
    };

    bookings.forEach((b) => {
      b.campaigns?.forEach((campaign) => {
        const pipeline = campaign.pipeline;
        if (pipeline) {
          if (pipeline.bookingStatus?.confirmed) counts.bookingConfirmed++;
          if (pipeline.artwork?.confirmed) counts.artworkReceived++;
          if (pipeline.printingStatus?.confirmed) counts.printingStatus++;
          if (pipeline.mountingStatus?.confirmed) counts.mountingStatus++;
          if (pipeline.advertisingLive?.started) counts.advertisingLive++;
        }
      });
    });

    return counts;
  };

  const { totalReceived, totalDue } = getPaymentStats();
  const pipelineCounts = getPipelineStatusCounts();

  const pieChartData = {
    labels: ['Received', 'Due'],
    datasets: [
      {
        data: [totalReceived || 0.01, totalDue || 0.01], // Avoid zero-only pie chart
        backgroundColor: ['rgba(34, 197, 94, 0.7)', 'rgba(239, 68, 68, 0.7)'],
        borderWidth: 1,
      },
    ],
  };

  const pipelineChartData = {
    labels: [
      'Booking Confirmed',
      'Artwork Received',
      'Printing Status',
      'Mounting Status',
      'Advertisement Live',
    ],
    datasets: [
      {
        label: 'Completed',
        data: [
          pipelineCounts.bookingConfirmed,
          pipelineCounts.artworkReceived,
          pipelineCounts.printingStatus,
          pipelineCounts.mountingStatus,
          pipelineCounts.advertisingLive,
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderRadius: 8,
        barThickness: 20,
      },
    ],
  };

  return (
    <div className="min-h-screen w-[102%] bg-white text-black flex flex-col lg:flex-row">
      <Navbar />
      <main className="flex-1 mt-4 overflow-y-auto px-4 md:px-8 py-6 ml-0 lg:ml-64">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h1 className="text-3xl md:text-3xl ml-[1%] font-semibold">Dashboard</h1>
          <select
            className="border px-3 py-2 rounded text-sm bg-white shadow-sm"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="threeMonths">Last 3 Months</option>
          </select>
        </div>

        <div className="flex flex-col lg:flex-row justify-center items-center gap-10 mt-[5%] flex-wrap">
          {loading ? (
            <>
              <ShimmerCard />
              <ShimmerCard />
              <ShimmerCard />
              <ShimmerCard />
              <ShimmerCard />
            </>
          ) : (
            <>
              <Card className="max-w-[500px] shadow-md">
                <CardContent>
                  <h2 className="text-sm font-medium mb-2">Bookings</h2>
                  <div className="w-full h-[400px]">
                    <Bar data={graphData} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>

              <Card className="max-w-[500px] shadow-md">
                <CardContent>
                  <h2 className="text-sm font-medium mb-2">Proposals</h2>
                  <div className="w-full h-[400px]">
                    <Bar data={getProposalGraphData()} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>

              <Card className="max-w-[300px] shadow-md mt-4">
                <CardContent>
                  <h2 className="text-sm font-medium mb-2">Payment Overview</h2>
                  <div className="w-full h-[300px]">
                    <Pie data={pieChartData} options={pieOptions} />
                  </div>
                </CardContent>
              </Card>

              <Card className="max-w-[600px] shadow-md mt-28">
                <CardContent>
                  <h2 className="text-sm font-medium mb-2">Pipeline Status Overview</h2>
                  <div className="w-full h-[400px]">
                    <Bar data={pipelineChartData} options={pipelineOptions} />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

// Chart options
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: true, position: 'top' } },
  scales: {
    y: { beginAtZero: true, suggestedMax: 10, ticks: { stepSize: 1 } },
    x: {
      ticks: { autoSkip: false, maxRotation: 45, minRotation: 20 },
    },
  },
};

const pieOptions = {
  responsive: true,
  plugins: {
    legend: { display: true, position: 'top' },
    tooltip: {
      callbacks: {
        label: function (context) {
          const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
          const percentage = ((context.parsed / total) * 100).toFixed(2);
          return `${context.label}: ${context.parsed} (${percentage}%)`;
        },
      },
    },
  },
};

const pipelineOptions = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: { x: { beginAtZero: true, ticks: { stepSize: 1 } } },
};

export default BookingGraphDashboard;
