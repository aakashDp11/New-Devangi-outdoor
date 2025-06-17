
// import React, { useEffect, useState } from 'react';
// import Navbar from './Navbar';
// import * as XLSX from 'xlsx';
// import { saveAs } from 'file-saver';
// import dayjs from 'dayjs';

// const Card = ({ children, className = '', ...props }) => (
//   <div className={`bg-white border shadow-sm rounded-xl w-full ${className}`} {...props}>
//     {children}
//   </div>
// );

// const CardContent = ({ children, className = '' }) => (
//   <div className={`p-4 ${className}`}>{children}</div>
// );

// const Input = (props) => (
//   <input className="border px-3 py-2 rounded text-sm w-full" {...props} />
// );

// const Select = ({ children, ...props }) => (
//   <select className="border px-3 py-2 rounded text-sm w-full" {...props}>
//     {children}
//   </select>
// );

// export default function Report() {
//   const [bookings, setBookings] = useState([]);
//   const [filteredBookings, setFilteredBookings] = useState([]);
//   const [bookingFilters, setBookingFilters] = useState({
//     client: '',
//     paymentStatus: '',
//     startDate: '',
//     endDate: '',
//   });

//   const [paymentFilters, setPaymentFilters] = useState({
//     client: '',
//     booking: '',
//     startDate: '',
//     endDate: '',
//   });

//   useEffect(() => {
//     fetchBookings();
//   }, []);

//   useEffect(() => {
//     applyBookingFilters();
//   }, [bookings, bookingFilters]);

//   const fetchBookings = async () => {
//     try {
//       const res = await fetch('http://localhost:3000/api/bookings');
//       const data = await res.json();
//       setBookings(data.bookings || []);
//     } catch (err) {
//       console.error('Failed to fetch bookings:', err);
//     }
//   };

//   const applyBookingFilters = () => {
//     let result = [...bookings];

//     const { client, paymentStatus, startDate, endDate } = bookingFilters;

//     if (client) {
//       result = result.filter((b) =>
//         b.clientName?.toLowerCase().includes(client.toLowerCase())
//       );
//     }

//     if (paymentStatus) {
//       result = result.filter((b) => {
//         let totalPaid = 0;
//         let totalAmount = 0;

//         b.campaigns?.forEach((c) => {
//           const p = c.pipeline?.payment;
//           if (p) {
//             totalPaid += p.totalPaid || 0;
//             totalAmount += p.totalAmount || 0;
//           }
//         });

//         if (paymentStatus === 'pending') return totalPaid < totalAmount;
//         return totalPaid >= totalAmount && totalAmount > 0;
//       });
//     }

//     if (startDate) {
//       result = result.filter((b) =>
//         dayjs(b.createdAt).isAfter(dayjs(startDate).subtract(1, 'day'))
//       );
//     }

//     if (endDate) {
//       result = result.filter((b) =>
//         dayjs(b.createdAt).isBefore(dayjs(endDate).add(1, 'day'))
//       );
//     }

//     setFilteredBookings(result);
//   };

//   const downloadExcel = (rows, filename) => {
//     const sheet = XLSX.utils.json_to_sheet(rows);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, sheet, 'Report');
//     const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
//     const file = new Blob([buf], { type: 'application/octet-stream' });
//     saveAs(file, filename);
//   };

//   const getPaymentRows = () => {
//     const rows = [];

//     bookings.forEach((b) => {
//       b.campaigns?.forEach((c) => {
//         const p = c.pipeline?.payment;
//         if (!p) return;
//         const payments = p.payments || [];

//         payments.forEach((pay) => {
//           const date = pay.date ? dayjs(pay.date) : null;

//           if (paymentFilters.client && !b.clientName?.toLowerCase().includes(paymentFilters.client.toLowerCase()))
//             return;
//           if (paymentFilters.booking && !b.companyName?.toLowerCase().includes(paymentFilters.booking.toLowerCase()))
//             return;
//           if (paymentFilters.startDate && date?.isBefore(dayjs(paymentFilters.startDate)))
//             return;
//           if (paymentFilters.endDate && date?.isAfter(dayjs(paymentFilters.endDate)))
//             return;

//           rows.push({
//             Booking: b.companyName,
//             Client: b.clientName,
//             Amount: pay.amount,
//             Date: date?.format('DD MMM YYYY'),
//             Mode: pay.modeOfPayment,
//           });
//         });
//       });
//     });

//     return rows;
//   };

//   return (
//     <div className=" bg-[#fafafb] w-[111%] text-black flex flex-col">
//       <Navbar />
//       <main className="flex-1 h-full overflow-y-auto px-4 md:px-6 py-6 ml-0 lg:ml-64">
//         <h2 className="text-2xl font-sans mb-6">Reports</h2>

//         {/* Bookings Section */}
//         <Card className="mb-10">
//           <CardContent>
//             <h3 className="text-lg  mb-4">Booking Filters</h3>
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//               <Input
//                 placeholder="Client Name"
//                 value={bookingFilters.client}
//                 onChange={(e) =>
//                   setBookingFilters({ ...bookingFilters, client: e.target.value })
//                 }
//               />
//               <Select
//                 value={bookingFilters.paymentStatus}
//                 onChange={(e) =>
//                   setBookingFilters({ ...bookingFilters, paymentStatus: e.target.value })
//                 }
//               >
//                 <option value="">All Payment Status</option>
//                 <option value="pending">Pending</option>
//                 <option value="completed">Completed</option>
//               </Select>
//               <Input
//                 type="date"
//                 value={bookingFilters.startDate}
//                 onChange={(e) =>
//                   setBookingFilters({ ...bookingFilters, startDate: e.target.value })
//                 }
//               />
//               <Input
//                 type="date"
//                 value={bookingFilters.endDate}
//                 onChange={(e) =>
//                   setBookingFilters({ ...bookingFilters, endDate: e.target.value })
//                 }
//               />
//             </div>

//             <div className="flex justify-between mb-3">
//               <h3 className="text-md ">Bookings Table</h3>
//               <button
//                 className="px-3 py-2 bg-black text-white rounded text-xs hover:bg-gray-800"
//                 onClick={() => downloadExcel(filteredBookings, 'bookings.xlsx')}
//               >
//                 Download Excel
//               </button>
//             </div>

//             <div className="overflow-x-auto">
//               <table className="w-full text-xs text-left border">
//                 <thead className="bg-gray-100 ">
//                   <tr>
//                     <th className="p-2 border">Company</th>
//                     <th className="p-2 border">Client</th>
//                     <th className="p-2 border">Created At</th>
//                     <th className="p-2 border">Payment Status</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {filteredBookings.map((b) => {
//                     let totalPaid = 0;
//                     let totalAmount = 0;

//                     b.campaigns?.forEach((c) => {
//                       const p = c.pipeline?.payment;
//                       if (p) {
//                         totalPaid += p.totalPaid || 0;
//                         totalAmount += p.totalAmount || 0;
//                       }
//                     });

//                     return (
//                       <tr key={b._id} className="border-t">
//                         <td className="p-2 border">{b.companyName}</td>
//                         <td className="p-2 border">{b.clientName}</td>
//                         <td className="p-2 border">
//                           {dayjs(b.createdAt).format('DD MMM YYYY')}
//                         </td>
//                         <td className="p-2 border">
//                           {totalPaid < totalAmount ? 'Pending' : 'Completed'}
//                         </td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>
//           </CardContent>
//         </Card>

//         {/* Payments Section */}
//         <Card>
//           <CardContent>
//             <h3 className="text-lg  mb-4">Payment Filters</h3>
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//               <Input
//                 placeholder="Client Name"
//                 value={paymentFilters.client}
//                 onChange={(e) =>
//                   setPaymentFilters({ ...paymentFilters, client: e.target.value })
//                 }
//               />
//               <Input
//                 placeholder="Booking Name"
//                 value={paymentFilters.booking}
//                 onChange={(e) =>
//                   setPaymentFilters({ ...paymentFilters, booking: e.target.value })
//                 }
//               />
//               <Input
//                 type="date"
//                 value={paymentFilters.startDate}
//                 onChange={(e) =>
//                   setPaymentFilters({ ...paymentFilters, startDate: e.target.value })
//                 }
//               />
//               <Input
//                 type="date"
//                 value={paymentFilters.endDate}
//                 onChange={(e) =>
//                   setPaymentFilters({ ...paymentFilters, endDate: e.target.value })
//                 }
//               />
//             </div>

//             <div className="flex justify-between mb-3">
//               <h3 className="text-md ">Payments Table</h3>
//               <button
//                 className="px-3 py-2 bg-black text-white rounded text-xs hover:bg-gray-800"
//                 onClick={() => downloadExcel(getPaymentRows(), 'payments.xlsx')}
//               >
//                 Download Excel
//               </button>
//             </div>

//             <div className="overflow-x-auto">
//               <table className="w-full text-xs text-left border">
//                 <thead className="bg-gray-100">
//                   <tr>
//                     <th className="p-2 border">Booking</th>
//                     <th className="p-2 border">Client</th>
//                     <th className="p-2 border">Amount</th>
//                     <th className="p-2 border">Date</th>
//                     <th className="p-2 border">Mode</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {getPaymentRows().map((p, idx) => (
//                     <tr key={idx} className="border-t">
//                       <td className="p-2 border">{p.Booking}</td>
//                       <td className="p-2 border">{p.Client}</td>
//                       <td className="p-2 border">₹{p.Amount?.toLocaleString()}</td>
//                       <td className="p-2 border">{p.Date}</td>
//                       <td className="p-2 border capitalize">{p.Mode}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </CardContent>
//         </Card>
//       </main>
//     </div>
//   );
// }


import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';

const Card = ({ children, className = '', ...props }) => (
  <div className={`bg-white border shadow-sm rounded-xl w-full ${className}`} {...props}>
    {children}
  </div>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

const Input = (props) => (
  <input className="border px-3 py-2 rounded text-sm w-full" {...props} />
);

const Select = ({ children, ...props }) => (
  <select className="border px-3 py-2 rounded text-sm w-full" {...props}>
    {children}
  </select>
);

export default function Report() {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [bookingFilters, setBookingFilters] = useState({
    client: '',
    paymentStatus: '',
    startDate: '',
    endDate: '',
  });

  const [paymentFilters, setPaymentFilters] = useState({
    client: '',
    booking: '',
    startDate: '',
    endDate: '',
  });

  const [changelogs, setChangelogs] = useState([]);
  const [filteredChangelogs, setFilteredChangelogs] = useState([]);
  const [changelogFilters, setChangelogFilters] = useState({
    searchText: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchBookings();
    fetchChangelogs();
  }, []);

  useEffect(() => {
    applyBookingFilters();
  }, [bookings, bookingFilters]);

  useEffect(() => {
    applyChangelogFilters();
  }, [changelogs, changelogFilters]);

  const fetchBookings = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/bookings');
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    }
  };

  const fetchChangelogs = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/pipeline/change-Log');
      const data = await res.json();
      console.log("changelogs data is",data);
      setChangelogs(data.changelogs || []);
    } catch (err) {
      console.error('Failed to fetch changelogs:', err);
    }
  };

  const applyBookingFilters = () => {
    let result = [...bookings];
    const { client, paymentStatus, startDate, endDate } = bookingFilters;

    if (client) {
      result = result.filter((b) =>
        b.clientName?.toLowerCase().includes(client.toLowerCase())
      );
    }

    if (paymentStatus) {
      result = result.filter((b) => {
        let totalPaid = 0;
        let totalAmount = 0;
        b.campaigns?.forEach((c) => {
          const p = c.pipeline?.payment;
          if (p) {
            totalPaid += p.totalPaid || 0;
            totalAmount += p.totalAmount || 0;
          }
        });
        if (paymentStatus === 'pending') return totalPaid < totalAmount;
        return totalPaid >= totalAmount && totalAmount > 0;
      });
    }

    if (startDate) {
      result = result.filter((b) =>
        dayjs(b.createdAt).isAfter(dayjs(startDate).subtract(1, 'day'))
      );
    }

    if (endDate) {
      result = result.filter((b) =>
        dayjs(b.createdAt).isBefore(dayjs(endDate).add(1, 'day'))
      );
    }

    setFilteredBookings(result);
  };

  const applyChangelogFilters = () => {
    let result = [...changelogs];
    const { searchText, startDate, endDate } = changelogFilters;

    if (searchText) {
      const lower = searchText.toLowerCase();
      result = result.filter((log) => {
        return (
          log.campaignId?.campaignName?.toLowerCase().includes(lower) ||
          log.userName?.toLowerCase().includes(lower) ||
          log.userEmail?.toLowerCase().includes(lower) ||
          log.changeType?.toLowerCase().includes(lower)
        );
      });
    }

    if (startDate) {
      result = result.filter((log) =>
        dayjs(log.createdAt).isAfter(dayjs(startDate).subtract(1, 'day'))
      );
    }

    if (endDate) {
      result = result.filter((log) =>
        dayjs(log.createdAt).isBefore(dayjs(endDate).add(1, 'day'))
      );
    }

    setFilteredChangelogs(result);
  };

  const downloadExcel = (rows, filename) => {
    const sheet = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, 'Report');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const file = new Blob([buf], { type: 'application/octet-stream' });
    saveAs(file, filename);
  };

  const getPaymentRows = () => {
    const rows = [];
    bookings.forEach((b) => {
      b.campaigns?.forEach((c) => {
        const p = c.pipeline?.payment;
        if (!p) return;
        const payments = p.payments || [];
        payments.forEach((pay) => {
          const date = pay.date ? dayjs(pay.date) : null;
          if (paymentFilters.client && !b.clientName?.toLowerCase().includes(paymentFilters.client.toLowerCase())) return;
          if (paymentFilters.booking && !b.companyName?.toLowerCase().includes(paymentFilters.booking.toLowerCase())) return;
          if (paymentFilters.startDate && date?.isBefore(dayjs(paymentFilters.startDate))) return;
          if (paymentFilters.endDate && date?.isAfter(dayjs(paymentFilters.endDate))) return;
          rows.push({
            Booking: b.companyName,
            Client: b.clientName,
            Amount: pay.amount,
            Date: date?.format('DD MMM YYYY'),
            Mode: pay.modeOfPayment,
          });
        });
      });
    });
    return rows;
  };

  const getChangelogRows = () =>
    filteredChangelogs.map((log) => ({
      Campaign: log.campaignId?.campaignName || '',
      User: log.userName || log.userId?.name || '',
      Email: log.userEmail,
      ChangeType: log.changeType,
      Previous: JSON.stringify(log.previousValue),
      New: JSON.stringify(log.newValue),
      Date: dayjs(log.createdAt).format('DD MMM YYYY HH:mm'),
    }));

  return (
    <div className="bg-[#fafafb] w-[111%] bg-white text-black flex flex-col">
      <Navbar />
      <main className="flex-1 h-full overflow-y-auto px-4 md:px-6 py-6 ml-0 lg:ml-64">
        <h2 className="text-2xl font-sans mb-6">Reports</h2>

        {/* Bookings Section */}
        <Card className="mb-10">
          <CardContent>
            <h3 className="text-lg mb-4">Booking Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Input placeholder="Client Name" value={bookingFilters.client} onChange={(e) => setBookingFilters({ ...bookingFilters, client: e.target.value })} />
              <Select value={bookingFilters.paymentStatus} onChange={(e) => setBookingFilters({ ...bookingFilters, paymentStatus: e.target.value })}>
                <option value="">All Payment Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </Select>
              <Input type="date" value={bookingFilters.startDate} onChange={(e) => setBookingFilters({ ...bookingFilters, startDate: e.target.value })} />
              <Input type="date" value={bookingFilters.endDate} onChange={(e) => setBookingFilters({ ...bookingFilters, endDate: e.target.value })} />
            </div>

            <div className="flex justify-between mb-3">
              <h3 className="text-md">Bookings Table</h3>
              <button className="px-3 py-2 bg-black text-white rounded text-xs hover:bg-gray-800" onClick={() => downloadExcel(filteredBookings, 'bookings.xlsx')}>
                Download Excel
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">Company</th>
                    <th className="p-2 border">Client</th>
                    <th className="p-2 border">Created At</th>
                    <th className="p-2 border">Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((b) => {
                    let totalPaid = 0, totalAmount = 0;
                    b.campaigns?.forEach((c) => {
                      const p = c.pipeline?.payment;
                      if (p) {
                        totalPaid += p.totalPaid || 0;
                        totalAmount += p.totalAmount || 0;
                      }
                    });
                    return (
                      <tr key={b._id} className="border-t">
                        <td className="p-2 border">{b.companyName}</td>
                        <td className="p-2 border">{b.clientName}</td>
                        <td className="p-2 border">{dayjs(b.createdAt).format('DD MMM YYYY')}</td>
                        <td className="p-2 border">{totalPaid < totalAmount ? 'Pending' : 'Completed'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Payments Section */}
        <Card>
          <CardContent>
            <h3 className="text-lg mb-4">Payment Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Input placeholder="Client Name" value={paymentFilters.client} onChange={(e) => setPaymentFilters({ ...paymentFilters, client: e.target.value })} />
              <Input placeholder="Booking Name" value={paymentFilters.booking} onChange={(e) => setPaymentFilters({ ...paymentFilters, booking: e.target.value })} />
              <Input type="date" value={paymentFilters.startDate} onChange={(e) => setPaymentFilters({ ...paymentFilters, startDate: e.target.value })} />
              <Input type="date" value={paymentFilters.endDate} onChange={(e) => setPaymentFilters({ ...paymentFilters, endDate: e.target.value })} />
            </div>

            <div className="flex justify-between mb-3">
              <h3 className="text-md">Payments Table</h3>
              <button className="px-3 py-2 bg-black text-white rounded text-xs hover:bg-gray-800" onClick={() => downloadExcel(getPaymentRows(), 'payments.xlsx')}>
                Download Excel
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 border">Booking</th>
                    <th className="p-2 border">Client</th>
                    <th className="p-2 border">Amount</th>
                    <th className="p-2 border">Date</th>
                    <th className="p-2 border">Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {getPaymentRows().map((p, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="p-2 border">{p.Booking}</td>
                      <td className="p-2 border">{p.Client}</td>
                      <td className="p-2 border">₹{p.Amount?.toLocaleString()}</td>
                      <td className="p-2 border">{p.Date}</td>
                      <td className="p-2 border capitalize">{p.Mode}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Changelog Section */}
<Card className="mt-10">
  <CardContent>
    <h3 className="text-lg mb-4">Change Logs</h3>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Input
        placeholder="Search"
        value={changelogFilters.searchText}
        onChange={(e) =>
          setChangelogFilters({ ...changelogFilters, searchText: e.target.value })
        }
      />
      <Input
        type="date"
        value={changelogFilters.startDate}
        onChange={(e) =>
          setChangelogFilters({ ...changelogFilters, startDate: e.target.value })
        }
      />
      <Input
        type="date"
        value={changelogFilters.endDate}
        onChange={(e) =>
          setChangelogFilters({ ...changelogFilters, endDate: e.target.value })
        }
      />
      <button
        className="px-3 py-2 bg-black text-white rounded text-sm hover:bg-gray-800"
        onClick={() => downloadExcel(getChangelogRows(), 'changelogs.xlsx')}
      >
        Download Excel
      </button>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full text-xs text-left border">
        {/* <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">Campaign</th>
            <th className="p-2 border">User</th>
            <th className="p-2 border">Email</th>
            <th className="p-2 border">Change Type</th>
            <th className="p-2 border">Previous Info</th>
            <th className="p-2 border">New Info</th>
            <th className="p-2 border">Date</th>
          </tr>
        </thead> */}
        <thead className="bg-gray-100">
  <tr>
    <th className="p-2 border">Campaign</th>
    <th className="p-2 border">Booking</th>
    <th className="p-2 border">Client</th>
    <th className="p-2 border">User</th>
    <th className="p-2 border">Email</th>
    <th className="p-2 border">Change Type</th>
    <th className="p-2 border">Previous Info</th>
    <th className="p-2 border">New Info</th>
    <th className="p-2 border">Date</th>
  </tr>
</thead>

        <tbody>
  {filteredChangelogs.map((log) => (
    <tr key={log._id} className="border-t">
      <td className="p-2 border">{log.campaignId?.campaignName}</td>
      <td className="p-2 border">{log.bookingName || '-'}</td>
      <td className="p-2 border">{log.clientName || '-'}</td>
      <td className="p-2 border">{log.userName || log.userId?.name}</td>
      <td className="p-2 border">{log.userEmail}</td>
      <td className="p-2 border">{log.changeType}</td>

      {/* Previous Value cell (from earlier response) */}
      <td className="p-2 border whitespace-pre-wrap text-[10px]">
        {log.previousValue && Object.keys(log.previousValue).length > 0 ? (
          Object.entries(log.previousValue).map(([key, val]) => (
            <div key={key}>
              <strong>{key}:</strong>{' '}
              {Array.isArray(val) ? (
                val.length === 0 ? (
                  '[]'
                ) : (
                  <ul className="list-disc ml-4">
                    {val.map((item, idx) => (
                      <li key={idx}>
                        {typeof item === 'object'
                          ? Object.entries(item)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(', ')
                          : String(item)}
                      </li>
                    ))}
                  </ul>
                )
              ) : typeof val === 'object' ? (
                JSON.stringify(val)
              ) : (
                String(val)
              )}
            </div>
          ))
        ) : (
          <em>Creation Step</em>
        )}
      </td>

      {/* New Value cell (same logic) */}
      <td className="p-2 border whitespace-pre-wrap text-[10px]">
        {Object.entries(log.newValue || {}).map(([key, val]) => (
          <div key={key}>
            <strong>{key}:</strong>{' '}
            {Array.isArray(val) ? (
              val.length === 0 ? (
                '[]'
              ) : (
                <ul className="list-disc ml-4">
                  {val.map((item, idx) => (
                    <li key={idx}>
                      {typeof item === 'object'
                        ? Object.entries(item)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(', ')
                        : String(item)}
                    </li>
                  ))}
                </ul>
              )
            ) : typeof val === 'object' ? (
              JSON.stringify(val)
            ) : (
              String(val)
            )}
          </div>
        ))}
      </td>

      <td className="p-2 border">
        {dayjs(log.createdAt).format('DD MMM YYYY HH:mm')}
      </td>
    </tr>
  ))}
</tbody>

      </table>
    </div>
  </CardContent>
</Card>

      </main>
    </div>
  );
}

