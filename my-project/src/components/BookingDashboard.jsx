

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const Input = ({ className = '', ...props }) => (
  <input className={`border px-3 py-2 rounded w-full ${className}`} {...props} />
);

export default function BookingsDashboard1() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/bookings');
        const data = await response.json();
        console.log(data.bookings);
        data.bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setBookings(data.bookings);
        console.log("Bookings data is",data);
      } catch (error) {
        console.error('Error fetching bookings:', error);
      }
    };

    fetchBookings();
  }, []);

  const filteredData = bookings.filter((item) =>
    item.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    item.clientName?.toLowerCase().includes(search.toLowerCase()) ||
    item.brandDisplayName?.toLowerCase().includes(search.toLowerCase()) ||
    item.campaignName?.toLowerCase().includes(search.toLowerCase())
  );

  const getLatestPipelineStatus = (pipeline) => {
    if (!pipeline) return 'Yet to be started';
    if (pipeline.advertisingLive?.started) return 'Advertising Live';
    if (pipeline.mountingStatus?.confirmed) return 'Mounting Done';
    if (pipeline.printingStatus?.confirmed) return 'Printing Done';
    if (pipeline.payment?.paymentDue === 0 && pipeline.payment?.totalPaid > 0) return 'Payment Done';
    if (pipeline.invoice?.invoiceNumber) return 'Invoice Received';
    if (pipeline.artwork?.confirmed) return 'Artwork Received';
    if (pipeline.po?.confirmed) return 'PO Received';
    if (pipeline.bookingStatus?.confirmed) return 'Booking Confirmed';
    return 'Yet to be started';
  };

  const paginatedData = filteredData.slice((currentPage - 1) * perPage, currentPage * perPage);
  const totalPages = Math.ceil(filteredData.length / perPage);

  return (
    <div className="min-h-screen w-screen bg-white text-black flex flex-col lg:flex-row overflow-hidden">
      <Navbar />

      <main className="flex-1 h-full overflow-y-auto px-4 md:px-6 py-6 ml-0 lg:ml-64">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-semibold">Bookings</h1>
          <button
            onClick={() => navigate('/create-booking')}
            className="bg-black text-white text-xs px-3 py-2 rounded hover:scale-105 transition"
          >
            + Create Order
          </button>
        </div>

        <Input
          className="md:w-[25%] h-[2rem] mb-4"
          placeholder="Search Bookings"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Client logo</th>
                <th>Booking ID</th>
                <th>Client Name</th>
                <th>Booking Date</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item) => (
                <tr
                  key={item._id}
                  className="hover cursor-pointer"
                  onClick={() => navigate(`/booking/${item._id}`)}
                >
                  <td>
  
  {item.companyLogo ? (
  <div className="avatar">
    <div className="mask mask-squircle w-8 h-8 overflow-hidden">
      <img
        src={item.companyLogo}
        alt="Client logo"
        className="w-full h-full object-contain"
      />
    </div>
  </div>
) : (
  <span>No Image</span>
)}

</td>

                  <td>{item._id}</td>
                  <td>{item.clientName || 'No Client'}</td>

                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
 
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded ${
                i + 1 === currentPage ? 'bg-black text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
