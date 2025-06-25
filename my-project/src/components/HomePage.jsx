
// import dayjs from 'dayjs';
// import Navbar from './Navbar';
// import { useState, useEffect } from 'react';
// import { BarChart } from '@mui/x-charts/BarChart';
// import { PieChart } from '@mui/x-charts/PieChart';
// import { Grid } from '@mui/material';
// import { useAuth } from '../context/AuthContext';
// import { useNavigate } from 'react-router-dom';
// const Card = ({ children, className = '', ...props }) => (
//   <div className={`bg-white border shadow-sm rounded-xl w-full ${className}`} {...props}>
//     {children}
//   </div>
// );

// const Button = ({ children, className = '', ...props }) => (
//   <button className={`px-4 py-2 rounded bg-black text-white hover: transition ${className}`} {...props}>
//     {children}
//   </button>
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
//   const [muiBookingData, setMuiBookingData] = useState({ xLabels: [], yData: [] });
//   const [muiProposalData, setMuiProposalData] = useState({ xLabels: [], yData: [] });
//   const [loading, setLoading] = useState(true);
//   const [spaces, setSpaces] = useState([]);
// const navigate=useNavigate();
//   const { auth,logout } = useAuth();

//   useEffect(() => {
//     fetchData();
//   }, []);

//   useEffect(() => {
//     if (bookings.length) processBookingData();
//     if (proposals.length) processProposalData();
//   }, [range, bookings, proposals]);



// const fetchData = async () => {
//   try {
//     const token = localStorage.getItem('accessToken');
//      console.log("Token sent is",token);
//     setLoading(true);
//     const [bookingsRes, proposalsRes, spacesRes] = await Promise.all([
//       fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bookings`,{
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}`,
//       },
//     }),
//       fetch(`${import.meta.env.VITE_API_BASE_URL}/api/proposals`,{
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}`,
//       },
//     }),
//       fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces`,{
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}`,
//       },
//     }),
//     ]);
//     if (bookingsRes.status === 403 ||spacesRes.status === 403 || proposalsRes.status === 403 ) {
//       const res= bookingsRes.status === 403 ||spacesRes.status === 403 || proposalsRes.status === 403;
//       const errorData = await res.json();
//       if (errorData.message === 'Invalid or expired token') {
//         localStorage.removeItem('accessToken');
//         localStorage.removeItem('userId');
//         localStorage.removeItem('userRole');
//         localStorage.removeItem('userEmail');
//         navigate('/login'); // or use router.navigate('/login') if using React Router
//         return;
//       }
//     }

//     const [bookingsData, proposalsData, spacesData] = await Promise.all([
//       bookingsRes.json(),
//       proposalsRes.json(),
//       spacesRes.json(),
//     ]);

//     setBookings(bookingsData.bookings);
//     setProposals(proposalsData);
//     setSpaces(spacesData); // 👈 set space list
//   } catch (err) {
//     console.error('Failed to fetch data', err);
//   } finally {
//     setLoading(false);
//   }
// };





// const getRangeStart = (now) => {
//     const weekStart = now.startOf('week');
//     const monthStart = now.startOf('month');
//     const threeMonthsAgo = now.subtract(3, 'month').startOf('month');
//     return range === 'week' ? weekStart : range === 'month' ? monthStart : threeMonthsAgo;
//   };

//   const processBookingData = () => {
//     const now = dayjs();
//     const rangeStart = getRangeStart(now);
//     const dataMap = new Map();

//     bookings.forEach((b) => {
//       const createdAt = dayjs(b.createdAt);
//       if (!createdAt.isValid() || createdAt.isBefore(rangeStart)) return;
//       const key = createdAt.format('YYYY-MM-DD');
//       dataMap.set(key, (dataMap.get(key) || 0) + 1);
//     });

//     const sortedKeys = Array.from(dataMap.keys()).sort((a, b) => dayjs(a).unix() - dayjs(b).unix());

//     const xLabels = sortedKeys.map((key) => dayjs(key).format('DD MMM'));
//     const yData = sortedKeys.map((key) => dataMap.get(key));

//     console.log("✅ Processed Booking XLabels:", xLabels);
//     console.log("✅ Processed Booking YData:", yData);

//     setMuiBookingData({ xLabels, yData });
//   };

//   const processProposalData = () => {
//     const now = dayjs();
//     const rangeStart = getRangeStart(now);
//     const dataMap = new Map();

//     proposals.forEach((p) => {
//       const createdAt = dayjs(p.createdAt);
//       if (!createdAt.isValid() || createdAt.isBefore(rangeStart)) return;
//       const key = createdAt.format('YYYY-MM-DD');
//       dataMap.set(key, (dataMap.get(key) || 0) + 1);
//     });

//     const sortedKeys = Array.from(dataMap.keys()).sort((a, b) => dayjs(a).unix() - dayjs(b).unix());

//     const xLabels = sortedKeys.map((key) => dayjs(key).format('DD MMM'));
//     const yData = sortedKeys.map((key) => dataMap.get(key));

//     console.log("✅ Processed Proposal XLabels:", xLabels);
//     console.log("✅ Processed Proposal YData:", yData);

//     setMuiProposalData({ xLabels, yData });
//   };

//   const getPaymentStats = () => {
//     let totalReceived = 0;
//     let totalDue = 0;

//     bookings.forEach((b) => {
//       b.campaigns?.forEach((campaign) => {
//         const pipeline = campaign.pipeline;
//         if (pipeline && pipeline.payment) {
//           totalReceived += pipeline.payment.totalPaid || 0;
//           totalDue += pipeline.payment.paymentDue || 0;
//         }
//       });
//     });

//     return { totalReceived, totalDue };
//   };







// const getAvailabilityStats = () => {
//   const counts = {
//     available: 0,
//     booked: 0,
//     overlapping: 0,
//   };

//   spaces
//     .filter((space) => space.spaceType !== 'DOOH')
//     .forEach((space) => {
//       const occupied = space.occupiedUnits || 0;
//       const overlapping = space.overlappingBooking;

//       if (occupied === 0) {
//         counts.available++;
//       } else if (overlapping) {
//         counts.overlapping++;
//       } else {
//         counts.booked++;
//       }
//     });

//   return counts;
// };


// // const getUnitUtilizationStats = () => {
// //   let totalUnits = 0;
// //   let totalBooked = 0;

// //   const spaceMap = new Map();

// //   bookings.forEach((booking) => {
// //     booking.campaigns?.forEach((campaign) => {
// //       campaign.spaces?.forEach((spaceWrapper) => {
// //         const space = spaceWrapper.id;
// //         const spaceId = space?._id;

// //         if (!space || spaceMap.has(spaceId)) return;

// //         const units = space.unit || 0;
// //         const occupied = space.occupiedUnits || 0;

// //         totalUnits += units;
// //         totalBooked += occupied;

// //         spaceMap.set(spaceId, true);
// //       });
// //     });
// //   });

// //   return {
// //     bookedUnits: totalBooked,
// //     freeUnits: totalUnits - totalBooked,
// //   };
// // };

// const getUnitUtilizationStats = () => {
//   let totalUnits = 0;
//   let totalBooked = 0;

//   spaces
//     .filter((space) => space.spaceType === 'DOOH')
//     .forEach((space) => {
//       const units = space.unit || 0;
//       const occupied = space.occupiedUnits || 0;

//       totalUnits += units;
//       totalBooked += occupied;
//     });

//   return {
//     bookedUnits: totalBooked,
//     freeUnits: totalUnits - totalBooked,
//   };
// };

  

//   const getPipelineStatusCounts = () => {
//   const counts = {
//     bookingConfirmed: 0,
//     artworkReceived: 0,
//     printingStatus: 0,
//     mountingStatus: 0,
//     poReceived: 0,        // ✅ Add
//     invoiceReceived: 0,
//   };

//   bookings.forEach((b) => {
//     b.campaigns?.forEach((campaign) => {
//       const pipeline = campaign.pipeline;
//       if (pipeline) {
//         if (pipeline.bookingStatus?.confirmed) counts.bookingConfirmed++;
//         if (pipeline.artwork?.confirmed) counts.artworkReceived++;
//         if (pipeline.po?.documentUrl) counts.poReceived++;                     // ✅ Check if PO is confirmed
//         if (pipeline.invoice?.invoiceNumber) counts.invoiceReceived++; 

//         // Check printingStatus and mountingStatus for each space
//         campaign.spaces?.forEach((space) => {
//           if (space?.id?.printingStatus?.confirmed) counts.printingStatus++;
//           if (space?.id?.mountingStatus?.confirmed) counts.mountingStatus++;
//         });
//       }
//     });
//   });

//   return counts;
// };



//   const { totalReceived, totalDue } = getPaymentStats();
//   const availabilityStats = getAvailabilityStats();
//   const pipelineCounts = getPipelineStatusCounts();

//   const paymentPieData = [
//     { id: 0, value: totalReceived || 0.01, label: 'Received' },
//     { id: 1, value: totalDue || 0.01, label: 'Due' },
//   ];


//   const availabilityPieData = [
//   { id: 0, value: availabilityStats.available || 0.01, label: 'Available' },
//   { id: 1, value: availabilityStats.booked || 0.01, label: 'Booked' },
//   { id: 2, value: availabilityStats.overlapping || 0.01, label: 'Overlapping Booking' },
// ];

//   const pipelineBarData = {
//   labels: [
//     'Booking Confirmed',
//     'Artwork Received',
//     'Printing Status',
//     'Mounting Status',
//      'PO',           // ✅ New
//     'Invoice'
//   ],
//   values: [
//     pipelineCounts.bookingConfirmed,
//     pipelineCounts.artworkReceived,
//     pipelineCounts.printingStatus,
//     pipelineCounts.mountingStatus,
//      pipelineCounts.poReceived,           // ✅ New
//     pipelineCounts.invoiceReceived,
//   ],
// };
// const unitUtilizationStats = getUnitUtilizationStats();
// const unitUtilizationPieData = [
//   { id: 0, value: unitUtilizationStats.bookedUnits || 0.01, label: 'Booked Units' },
//   { id: 1, value: unitUtilizationStats.freeUnits || 0.01, label: 'Free Units' },
// ];

//   return (
//     <div className="min-h-screen  h-screen w-screen bg-white text-black flex flex-col  ">
      
//       <Navbar />
//       <main className="flex-1 h-full overflow-y-auto px-4 md:px-6 py-6 ml-0 lg:ml-64">
//         <div className="flex flex-col md:flex-row mb-4 gap-4">
//           <h2 className="text-3xl font-sans md:text-3xl ml-[1%] ">Dashboard</h2>
//            <Button onClick={logout}  className="text-xs ml-auto w-full md:w-auto hover:-translate-y-1 hover:scale-110 transition">
//              Log Out
//             </Button>
//         </div>

//         <div className="flex flex-row w-full gap-[5%] mt-6">
          
//           {loading ? (
//             <>
//               <ShimmerCard />
//               <ShimmerCard />
//             </>
//           ) : (
//             <>
            
//               <Card className="max-w-[270px] h-[30%] shadow-md mt-4">
//                 <CardContent>
//                   <h2 className="text-sm font-medium mb-2">Payment Overview</h2>
//                   <div className='flex mt-4'>
//                     <div className='ml-auto text-[0.8rem]'>
//                        <p><strong>Received:</strong> ₹{totalReceived.toLocaleString()}</p>
//         <p><strong>Due:</strong> ₹{totalDue.toLocaleString()}</p>
//                     </div>
//                   </div>
//                   <div className="w-full ">
//                     <PieChart
//                       series={[{ data: paymentPieData, innerRadius: 40 }]}
//                       height={200}
//                       width={150}
//                     />
                    
                  
//     </div>
//                 </CardContent>
//               </Card>
             
//               <Card className="max-w-[275px] h-[30%] shadow-md mt-4">
//   <CardContent>
//     <h2 className="text-sm font-medium mb-2">DOOH Unit Utilization</h2>
//     <div className="w-full">
//       <div className='flex mt-4'>
//         <div className="ml-auto text-[0.8rem]">
//         <p><strong>Booked Units:</strong> {unitUtilizationStats.bookedUnits}</p>
//         <p><strong>Free Units:</strong> {unitUtilizationStats.freeUnits}</p>
//       </div>
//       </div>
//       <PieChart
//         series={[{ data: unitUtilizationPieData, innerRadius: 40 }]}
//         height={200}
//         width={150}
//       />
      
//     </div>
//   </CardContent>
// </Card>


//               <Card className="max-w-[320px] h-[30%] shadow-md mt-4">
//                 <CardContent>
//                   <h2 className="text-sm font-medium mb-2">Static Space Availability</h2>
//                   <div className="w-full ">
//                      <div className='flex mt-4'>
//         <div className="ml-auto text-[0.7rem]">
//         <p><strong> Available:</strong> {availabilityStats.available}</p>
//         {/* <p><strong>Partially Available:</strong> {availabilityStats.partiallyAvailable}</p> */}
//         <p><strong> Booked:</strong> {availabilityStats.booked}</p>
//         <p><strong> Overlapping booking:</strong> {availabilityStats.overlapping}</p>
//       </div>
//       </div>
//                     <PieChart
//                       series={[{ data: availabilityPieData, innerRadius: 40 }]}
//                       height={190}
//                       width={150}
//                     />
                    
//                   </div>
//                 </CardContent>
//               </Card>

               
 

//             </>
//           )}
//         </div>


//         {!loading && (
//           <div className="mt-14 flex flex-col w-full">
//             <div className="flex mb-3 w-full">
//               <select
//                 className="border ml-auto px-3 py-2 rounded text-xs bg-white shadow-sm"
//                 value={range}
//                 onChange={(e) => setRange(e.target.value)}
//               >
//                 <option value="week">This Week</option>
//                 <option value="month">This Month</option>
//                 <option value="threeMonths">Last 3 Months</option>
//               </select>
//             </div>

//             <div className="flex w-full gap-[10%] ">
//               <Card className="w-full shadow-md">
//                 <CardContent>
//                   <h2 className="text-sm font-medium mb-2">Bookings</h2>
//                   <div className="w-full h-[400px]">
                  
//                     <BarChart
//   xAxis={[
//     {
//       scaleType: 'band',
//       data: muiBookingData.xLabels,
//       categoryGapRatio: 0.8, // ✅ Add this for spacing and centering
//       barGapRatio: 0.2,       // ✅ Add this for space between bars
//     },
//   ]}
//   series={[
//     {
//       data: muiBookingData.yData,
//       label: 'Number of Bookings',
//     },
//   ]}
//   height={400}
//   borderRadius={10}
//   slotProps={{
//     bar: {
//       width: 30,      // ✅ Let MUI auto-calculate width for even spacing
//       // cornerRadius: 10,
//     },
//   }}
// />

//                   </div>
//                 </CardContent>
//               </Card>

//               <Card className="w-full shadow-md">
//                 <CardContent>
//                   <h2 className="text-sm font-medium mb-2">Proposals</h2>
//                   <div className="w-full h-[400px]">
                   
//                     <BarChart
//   xAxis={[
//     {
//       scaleType: 'band',
//       data: muiProposalData.xLabels,
//       categoryGapRatio: 0.9,
//       barGapRatio: 0.2,
//     },
//   ]}
//   series={[
//     {
//       data: muiProposalData.yData,
//       label: 'Number of Proposals',
//     },
//   ]}
//   height={400}
//   borderRadius={10}
//   slotProps={{
//     bar: {
//       width: 30,
//       // cornerRadius: 10,
//     },
//   }}
// />

//                   </div>
//                 </CardContent>
//               </Card>
              
              

//             </div>
           
//           </div>
//         )}
//          <div className='flex w-[80%] mt-[10%]'>
//            <Card className="w-full shadow-md mt-4">
//     <CardContent>
//       <h2 className="text-sm font-medium mb-2">Campaign Status Overview</h2>
//       <div className="w-full h-[400px]">
       
//         <BarChart
//   xAxis={[{
//     scaleType: 'band',
//     data: pipelineBarData.labels,
//     barGapRatio: 0.5,
//     categoryGapRatio: 0.8,
//   }]}
//   series={[{
//     data: pipelineBarData.values,
//     label: 'Completed',
//   }]}
//   height={400}
//   borderRadius={10}
//   slotProps={{
//     bar: {
//       width: 30, // ✅ Thinner bars for better centering
//       cornerradius: 10,
//     },
//   }}
// />

//       </div>
//     </CardContent>
//   </Card>
//         </div>
//       </main>
//     </div>
//   );
// };

// export default BookingGraphDashboard;


// import dayjs from 'dayjs';
// import Navbar from './Navbar';
// import { useState, useEffect } from 'react';
// import { BarChart } from '@mui/x-charts/BarChart';
// import { PieChart } from '@mui/x-charts/PieChart';
// import { useAuth } from '../context/AuthContext';
// import { useNavigate } from 'react-router-dom';
// const Card = ({ children, className = '', ...props }) => (
//   <div className={`bg-white border shadow-sm rounded-xl w-full ${className}`} {...props}>
//     {children}
//   </div>
// );

// const Button = ({ children, className = '', ...props }) => (
//   <button className={`px-4 py-2 rounded bg-black text-white hover: transition ${className}`} {...props}>
//     {children}
//   </button>
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
//   const [muiBookingData, setMuiBookingData] = useState({ xLabels: [], yData: [] });
//   const [muiProposalData, setMuiProposalData] = useState({ xLabels: [], yData: [] });
//   const [loading, setLoading] = useState(true);
// const navigate = useNavigate();
//   const [unitUtilizationStats, setUnitUtilizationStats] = useState({
//     bookedUnits: 0,
//     freeUnits: 0,
//   });

//   const [availabilityStats, setAvailabilityStats] = useState({
//     available: 0,
//     booked: 0,
//     overlapping: 0,
//   });

//   const { auth, logout } = useAuth();

//   useEffect(() => {
//     fetchData();
//   }, []);

//   useEffect(() => {
//     if (bookings.length) processBookingData();
//     if (proposals.length) processProposalData();
//   }, [range, bookings, proposals]);



//   const fetchData = async () => {
//   try {
//     const token = localStorage.getItem('accessToken');
//     setLoading(true);

//     const urls = [
//       `${import.meta.env.VITE_API_BASE_URL}/api/bookings`,
//       `${import.meta.env.VITE_API_BASE_URL}/api/proposals`,
//       `${import.meta.env.VITE_API_BASE_URL}/api/spaces/dashboard-stats`,
//     ];

//     const headers = {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${token}`,
//     };

//     const responses = await Promise.all(
//       urls.map(url => fetch(url, { headers }))
//     );

//     // If any response is 403, redirect to login
//     if (responses.some(res => res.status === 403)) {
//       console.warn('Token expired or unauthorized. Redirecting to login...');
//       localStorage.removeItem('accessToken'); // Optional: clear token
//       navigate('/login');
//       return;
//     }

//     const [bookingsData, proposalsData, statsData] = await Promise.all(
//       responses.map(res => res.json())
//     );

//     setBookings(bookingsData.bookings);
//     setProposals(proposalsData);
//     setUnitUtilizationStats(statsData.doohUtilization);
//     setAvailabilityStats(statsData.staticAvailability);
//   } catch (err) {
//     console.error('Failed to fetch data', err);
//   } finally {
//     setLoading(false);
//   }
// };
//   const getRangeStart = (now) => {
//     const weekStart = now.startOf('week');
//     const monthStart = now.startOf('month');
//     const threeMonthsAgo = now.subtract(3, 'month').startOf('month');
//     return range === 'week' ? weekStart : range === 'month' ? monthStart : threeMonthsAgo;
//   };

//   const processBookingData = () => {
//     const now = dayjs();
//     const rangeStart = getRangeStart(now);
//     const dataMap = new Map();

//     bookings.forEach((b) => {
//       const createdAt = dayjs(b.createdAt);
//       if (!createdAt.isValid() || createdAt.isBefore(rangeStart)) return;
//       const key = createdAt.format('YYYY-MM-DD');
//       dataMap.set(key, (dataMap.get(key) || 0) + 1);
//     });

//     const sortedKeys = Array.from(dataMap.keys()).sort((a, b) => dayjs(a).unix() - dayjs(b).unix());
//     const xLabels = sortedKeys.map((key) => dayjs(key).format('DD MMM'));
//     const yData = sortedKeys.map((key) => dataMap.get(key));

//     setMuiBookingData({ xLabels, yData });
//   };

//   const processProposalData = () => {
//     const now = dayjs();
//     const rangeStart = getRangeStart(now);
//     const dataMap = new Map();

//     proposals.forEach((p) => {
//       const createdAt = dayjs(p.createdAt);
//       if (!createdAt.isValid() || createdAt.isBefore(rangeStart)) return;
//       const key = createdAt.format('YYYY-MM-DD');
//       dataMap.set(key, (dataMap.get(key) || 0) + 1);
//     });

//     const sortedKeys = Array.from(dataMap.keys()).sort((a, b) => dayjs(a).unix() - dayjs(b).unix());
//     const xLabels = sortedKeys.map((key) => dayjs(key).format('DD MMM'));
//     const yData = sortedKeys.map((key) => dataMap.get(key));

//     setMuiProposalData({ xLabels, yData });
//   };

//   const getPaymentStats = () => {
//     let totalReceived = 0;
//     let totalDue = 0;

//     bookings.forEach((b) => {
//       b.campaigns?.forEach((campaign) => {
//         const pipeline = campaign.pipeline;
//         if (pipeline && pipeline.payment) {
//           totalReceived += pipeline.payment.totalPaid || 0;
//           totalDue += pipeline.payment.paymentDue || 0;
//         }
//       });
//     });

//     return { totalReceived, totalDue };
//   };

//   const getPipelineStatusCounts = () => {
//     const counts = {
//       bookingConfirmed: 0,
//       artworkReceived: 0,
//       printingStatus: 0,
//       mountingStatus: 0,
//       poReceived: 0,
//       invoiceReceived: 0,
//     };

//     bookings.forEach((b) => {
//       b.campaigns?.forEach((campaign) => {
//         const pipeline = campaign.pipeline;
//         if (pipeline) {
//           if (pipeline.bookingStatus?.confirmed) counts.bookingConfirmed++;
//           if (pipeline.artwork?.confirmed) counts.artworkReceived++;
//           if (pipeline.po?.documentUrl) counts.poReceived++;
//           if (pipeline.invoice?.invoiceNumber) counts.invoiceReceived++;

//           campaign.spaces?.forEach((space) => {
//             if (space?.id?.printingStatus?.confirmed) counts.printingStatus++;
//             if (space?.id?.mountingStatus?.confirmed) counts.mountingStatus++;
//           });
//         }
//       });
//     });

//     return counts;
//   };

//   const { totalReceived, totalDue } = getPaymentStats();
//   const pipelineCounts = getPipelineStatusCounts();

//   const paymentPieData = [
//     { id: 0, value: totalReceived || 0.01, label: 'Received' },
//     { id: 1, value: totalDue || 0.01, label: 'Due' },
//   ];

//   const unitUtilizationPieData = [
//     { id: 0, value: unitUtilizationStats.bookedUnits || 0.01, label: 'Booked Units' },
//     { id: 1, value: unitUtilizationStats.freeUnits || 0.01, label: 'Free Units' },
//   ];

//   const availabilityPieData = [
//     { id: 0, value: availabilityStats.available || 0.01, label: 'Available' },
//     { id: 1, value: availabilityStats.booked || 0.01, label: 'Booked' },
//     { id: 2, value: availabilityStats.overlapping || 0.01, label: 'Overlapping Booking' },
//   ];

//   const pipelineBarData = {
//     labels: [
//       'Booking Confirmed',
//       'Artwork Received',
//       'Printing Status',
//       'Mounting Status',
//       'PO',
//       'Invoice',
//     ],
//     values: [
//       pipelineCounts.bookingConfirmed,
//       pipelineCounts.artworkReceived,
//       pipelineCounts.printingStatus,
//       pipelineCounts.mountingStatus,
//       pipelineCounts.poReceived,
//       pipelineCounts.invoiceReceived,
//     ],
//   };

//   return (
//     <div className="min-h-screen h-screen w-screen bg-white text-black flex flex-col">
//       <Navbar />
//       <main className="flex-1 h-full overflow-y-auto px-4 md:px-6 py-6 ml-0 lg:ml-64">
//         <div className="flex flex-col md:flex-row mb-4 gap-4">
//           <h2 className="text-3xl font-sans md:text-3xl ml-[1%]">Dashboard</h2>
//           <Button onClick={logout} className="text-xs ml-auto w-full md:w-auto hover:-translate-y-1 hover:scale-110 transition">
//             Log Out
//           </Button>
//         </div>

//         <div className="flex flex-row w-full gap-[5%] mt-6">
//           {loading ? (
//             <>
//               <ShimmerCard />
//               <ShimmerCard />
//             </>
//           ) : (
//             <>
//               {/* Payment Overview */}
//               <Card className="max-w-[270px] h-[30%] shadow-md mt-4">
//                 <CardContent>
//                   <h2 className="text-sm font-medium mb-2">Payment Overview</h2>
//                   <div className='flex mt-4'>
//                     <div className='ml-auto text-[0.8rem]'>
//                       <p><strong>Received:</strong> ₹{totalReceived.toLocaleString()}</p>
//                       <p><strong>Due:</strong> ₹{totalDue.toLocaleString()}</p>
//                     </div>
//                   </div>
//                   <PieChart series={[{ data: paymentPieData, innerRadius: 40 }]} height={200} width={150} />
//                 </CardContent>
//               </Card>

//               {/* DOOH Unit Utilization */}
//               <Card className="max-w-[275px] h-[30%] shadow-md mt-4">
//                 <CardContent>
//                   <h2 className="text-sm font-medium mb-2">DOOH Unit Utilization</h2>
//                   <div className="w-full">
//                     <div className='flex mt-4'>
//                       <div className="ml-auto text-[0.8rem]">
//                         <p><strong>Booked Units:</strong> {unitUtilizationStats.bookedUnits}</p>
//                         <p><strong>Free Units:</strong> {unitUtilizationStats.freeUnits}</p>
//                       </div>
//                     </div>
//                     <PieChart series={[{ data: unitUtilizationPieData, innerRadius: 40 }]} height={200} width={150} />
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* Static Space Availability */}
//               <Card className="max-w-[320px] h-[30%] shadow-md mt-4">
//                 <CardContent>
//                   <h2 className="text-sm font-medium mb-2">Static Space Availability</h2>
//                   <div className="w-full">
//                     <div className='flex mt-4'>
//                       <div className="ml-auto text-[0.7rem]">
//                         <p><strong>Available:</strong> {availabilityStats.available}</p>
//                         <p><strong>Booked:</strong> {availabilityStats.booked}</p>
//                         <p><strong>Overlapping booking:</strong> {availabilityStats.overlapping}</p>
//                       </div>
//                     </div>
//                     <PieChart series={[{ data: availabilityPieData, innerRadius: 40 }]} height={190} width={150} />
//                   </div>
//                 </CardContent>
//               </Card>
//             </>
//           )}
//         </div>

//         {!loading && (
//           <div className="mt-14 flex flex-col w-full">
//             <div className="flex mb-3 w-full">
//               <select
//                 className="border ml-auto px-3 py-2 rounded text-xs bg-white shadow-sm"
//                 value={range}
//                 onChange={(e) => setRange(e.target.value)}
//               >
//                 <option value="week">This Week</option>
//                 <option value="month">This Month</option>
//                 <option value="threeMonths">Last 3 Months</option>
//               </select>
//             </div>

//             <div className="flex w-full gap-[10%] ">
//               {/* Booking Chart */}
//               <Card className="w-full shadow-md">
//                 <CardContent>
//                   <h2 className="text-sm font-medium mb-2">Bookings</h2>
//                   <div className="w-full h-[400px]">
//                     <BarChart
//                       xAxis={[{ scaleType: 'band', data: muiBookingData.xLabels, categoryGapRatio: 0.8, barGapRatio: 0.2 }]}
//                       series={[{ data: muiBookingData.yData, label: 'Number of Bookings' }]}
//                       height={400}
//                       borderRadius={10}
//                       slotProps={{ bar: { width: 30 } }}
//                     />
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* Proposals Chart */}
//               <Card className="w-full shadow-md">
//                 <CardContent>
//                   <h2 className="text-sm font-medium mb-2">Proposals</h2>
//                   <div className="w-full h-[400px]">
//                     <BarChart
//                       xAxis={[{ scaleType: 'band', data: muiProposalData.xLabels, categoryGapRatio: 0.9, barGapRatio: 0.2 }]}
//                       series={[{ data: muiProposalData.yData, label: 'Number of Proposals' }]}
//                       height={400}
//                       borderRadius={10}
//                       slotProps={{ bar: { width: 30 } }}
//                     />
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>

//             {/* Campaign Status */}
//             <div className='flex w-[80%] mt-[10%]'>
//               <Card className="w-full shadow-md mt-4">
//                 <CardContent>
//                   <h2 className="text-sm font-medium mb-2">Campaign Status Overview</h2>
//                   <div className="w-full h-[400px]">
//                     <BarChart
//                       xAxis={[{ scaleType: 'band', data: pipelineBarData.labels, barGapRatio: 0.5, categoryGapRatio: 0.8 }]}
//                       series={[{ data: pipelineBarData.values, label: 'Completed' }]}
//                       height={400}
//                       borderRadius={10}
//                       slotProps={{ bar: { width: 30, cornerradius: 10 } }}
//                     />
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// };

// export default BookingGraphDashboard;





import dayjs from 'dayjs';
import Navbar from './Navbar';
import { useState, useEffect } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { PieChart } from '@mui/x-charts/PieChart';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
          </div>
        )}
      </main>
    </div>
  );
};

export default BookingGraphDashboard;
