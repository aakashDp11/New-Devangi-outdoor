// import React, { useState,useEffect } from 'react';
// import { useParams } from 'react-router-dom';
// import Navbar from './Navbar';

// export default function CampaignDetails() {
//   const { id } = useParams();
//   const [campaignData, setCampaignData] = useState(null);

//   useEffect(() => {
//     const fetchCampaign = async () => {
//       try {
//         const res = await fetch(`http://localhost:3000/api/bookings/campaign/${id}`);
//         const data = await res.json();
//         console.log("data is",data);
//         setCampaignData(data);
//       } catch (err) {
//         console.error('Failed to load campaign details:', err);
//       }
//     };

//     fetchCampaign();
//   }, [id]);
// if (!campaignData) return <div className="p-6">Loading campaign...</div>;
//   return (
//     <div className="bg-white text-xs">
//       <Navbar />
//       <main className="ml-64 w-full flex-1 px-8 py-4">
//         <div className="flex justify-between items-center mb-6">
//           <h1 className="text-2xl font-semibold">Campaign Details: {campaignData.campaignName}</h1>
//         </div>

//         <div className="flex space-x-4 mb-4">
//           {['Pipeline', 'Data'].map(tab => (
//             <button
//               key={tab}
//               onClick={() => setActiveTab(tab)}
//               className={`px-4 py-1 border rounded ${
//                 activeTab === tab ? 'bg-black text-white' : 'bg-white text-black border-gray-400'
//               } transition duration-200`}
//             >
//               {tab}
//             </button>
//           ))}
//         </div>

//         {activeTab === 'Pipeline' && (
//           <div className="grid grid-cols-2 gap-6">
//             <div>
//               <h2 className="font-medium mb-2">Artwork</h2>
//               {pipeline.artwork?.confirmed ? (
//                 <img src={pipeline.artwork.documentUrl} alt="Artwork" className="w-40 h-auto rounded border" />
//               ) : (
//                 <p className="text-gray-500">Not confirmed</p>
//               )}
//             </div>

//             <div>
//               <h2 className="font-medium mb-2">Booking</h2>
//               {pipeline.bookingStatus?.confirmed ? (
//                 <ul>
//                   <li><strong>Reference:</strong> {pipeline.bookingStatus.reference}</li>
//                   <li><strong>Date:</strong> {pipeline.bookingStatus.bookingDate}</li>
//                   <li><strong>By:</strong> {pipeline.bookingStatus.memberName}</li>
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">Not confirmed</p>
//               )}
//             </div>

//             <div>
//               <h2 className="font-medium mb-2">PO</h2>
//               {pipeline.po?.confirmed ? (
//                 <ul>
//                   <li><strong>PO Number:</strong> {pipeline.po.poNumber}</li>
//                   <li><strong>Date:</strong> {pipeline.po.poDate}</li>
//                   <li><strong>Value:</strong> ₹{pipeline.po.poValue}</li>
//                   <li>
//                     <a href={pipeline.po.documentUrl} target="_blank" className="text-blue-500 underline">View PO</a>
//                   </li>
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">Not confirmed</p>
//               )}
//             </div>

//             <div>
//               <h2 className="font-medium mb-2">Invoice</h2>
//               {pipeline.invoice?.invoiceNumber ? (
//                 <ul>
//                   <li><strong>Number:</strong> {pipeline.invoice.invoiceNumber}</li>
//                   <li><strong>Date:</strong> {pipeline.invoice.invoiceDate}</li>
//                   <li><strong>Value:</strong> ₹{pipeline.invoice.invoiceValue}</li>
//                   <li>
//                     <a href={pipeline.invoice.documentUrl} target="_blank" className="text-blue-500 underline">View Invoice</a>
//                   </li>
//                 </ul>
//               ) : (
//                 <p className="text-gray-500">Not uploaded</p>
//               )}
//             </div>

//             <div>
//               <h2 className="font-medium mb-2">Payment</h2>
//               <ul>
//                 <li><strong>Total:</strong> ₹{pipeline.payment?.totalAmount}</li>
//                 <li><strong>Paid:</strong> ₹{pipeline.payment?.totalPaid}</li>
//                 <li><strong>Due:</strong> ₹{pipeline.payment?.paymentDue}</li>
//               </ul>
//               <div className="mt-2">
//                 <h3 className="text-xs font-semibold mb-1">Payments:</h3>
//                 {pipeline.payment?.payments.map(p => (
//                   <div key={p._id} className="mb-1">
//                     ₹{p.amount} via {p.modeOfPayment} on {formatDate(p.date)}
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         )}

//         {activeTab === 'Data' && (
//           <div className="grid grid-cols-2 gap-6">
//             <div>
//               <h2 className="font-medium mb-2">Campaign Info</h2>
//               <p><strong>Description:</strong> {description}</p>
//               <p><strong>Start:</strong> {campaignData.startDate}</p>
//               <p><strong>End:</strong> {campaignData.endDate}</p>
//             </div>

//             <div>
//               <h2 className="font-medium mb-2">Space Details</h2>
//               <img src={space?.mainPhoto} alt="Main" className="w-48 h-32 object-cover rounded border mb-2" />
//               <ul>
//                 <li><strong>Name:</strong> {space?.spaceName}</li>
//                 <li><strong>Location:</strong> {space?.city}, {space?.state}</li>
//                 <li><strong>Type:</strong> {space?.spaceType}</li>
//                 <li><strong>Units:</strong> {space?.unit}</li>
//                 <li><strong>Occupied:</strong> {space?.occupiedUnits}</li>
//                 <li><strong>Availability:</strong> {space?.availability}</li>
//               </ul>
//             </div>
//           </div>
//         )}
//       </main>
//     </div>
//   );
// }

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from './Navbar';
import CampaignPipeline from './CampaignPipeline';
export default function CampaignDetails() {
  const { id } = useParams();
  const [campaignData, setCampaignData] = useState(null);
  const [activeTab, setActiveTab] = useState('Pipeline');

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/bookings/campaign/${id}`);
        const data = await res.json();
        console.log("Fetched campaign data:", data);
        setCampaignData(data);
      } catch (err) {
        console.error('Failed to load campaign details:', err);
      }
    };

    fetchCampaign();
  }, [id]);

  if (!campaignData) {
    return <div className="p-6">Loading campaign...</div>;
  }

  const { campaignName, description, startDate, endDate, pipeline, spaces = [] } = campaignData;
  const space = spaces[0]?.id;

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN');

  return (
    <div className="bg-white text-xs w-full">
      <Navbar />
      <main className="ml-64 w-full flex-1 px-8 py-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Campaign Details: {campaignName}</h1>
        </div>

        {/* Tab Buttons */}
        <div className="flex space-x-4 mb-4">
          {['Pipeline', 'Data'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1 border rounded ${
                activeTab === tab ? 'bg-black text-white' : 'bg-white text-black border-gray-400'
              } transition duration-200`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Pipeline Section */}
        {/* {activeTab === 'Pipeline' && (
          <div className="grid grid-cols-2 gap-6">
            <Section title="Artwork">
              {pipeline?.artwork?.confirmed ? (
                <img
                  src={pipeline.artwork.documentUrl}
                  alt="Artwork"
                  className="w-40 h-auto rounded border"
                />
              ) : (
                <p className="text-gray-500">Not confirmed</p>
              )}
            </Section>

            <Section title="Booking">
              {pipeline?.bookingStatus?.confirmed ? (
                <ul>
                  <li><strong>Reference:</strong> {pipeline.bookingStatus.reference}</li>
                  <li><strong>Date:</strong> {pipeline.bookingStatus.bookingDate}</li>
                  <li><strong>By:</strong> {pipeline.bookingStatus.memberName}</li>
                </ul>
              ) : (
                <p className="text-gray-500">Not confirmed</p>
              )}
            </Section>

            <Section title="PO">
              {pipeline?.po?.confirmed ? (
                <ul>
                  <li><strong>PO Number:</strong> {pipeline.po.poNumber}</li>
                  <li><strong>Date:</strong> {pipeline.po.poDate}</li>
                  <li><strong>Value:</strong> ₹{pipeline.po.poValue}</li>
                  <li>
                    <a
                      href={pipeline.po.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline"
                    >
                      View PO
                    </a>
                  </li>
                </ul>
              ) : (
                <p className="text-gray-500">Not confirmed</p>
              )}
            </Section>

            <Section title="Invoice">
              {pipeline?.invoice?.invoiceNumber ? (
                <ul>
                  <li><strong>Number:</strong> {pipeline.invoice.invoiceNumber}</li>
                  <li><strong>Date:</strong> {pipeline.invoice.invoiceDate}</li>
                  <li><strong>Value:</strong> ₹{pipeline.invoice.invoiceValue}</li>
                  <li>
                    <a
                      href={pipeline.invoice.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline"
                    >
                      View Invoice
                    </a>
                  </li>
                </ul>
              ) : (
                <p className="text-gray-500">Not uploaded</p>
              )}
            </Section>

            <Section title="Payment">
              <ul>
                <li><strong>Total:</strong> ₹{pipeline?.payment?.totalAmount || 0}</li>
                <li><strong>Paid:</strong> ₹{pipeline?.payment?.totalPaid || 0}</li>
                <li><strong>Due:</strong> ₹{pipeline?.payment?.paymentDue || 0}</li>
              </ul>
              <div className="mt-2">
                <h3 className="text-xs font-semibold mb-1">Payments:</h3>
                {pipeline?.payment?.payments?.length > 0 ? (
                  pipeline.payment.payments.map((p) => (
                    <div key={p._id} className="mb-1">
                      ₹{p.amount} via {p.modeOfPayment} on {formatDate(p.date)}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No payments</p>
                )}
              </div>
            </Section>
          </div>
        )} */}
        {activeTab === 'Pipeline' && (
  <div className="w-full">
    <CampaignPipeline campaignId={campaignData._id} />
  </div>
)}

        {/* Data Section */}
        {activeTab === 'Data' && (
          <div className="grid grid-cols-2 gap-6">
            <Section title="Campaign Info">
              <p><strong>Description:</strong> {description}</p>
              <p><strong>Start:</strong> {formatDate(startDate)}</p>
              <p><strong>End:</strong> {formatDate(endDate)}</p>
            </Section>

            <Section title="Space Details">
              {space?.mainPhoto && (
                <img
                  src={space.mainPhoto}
                  alt="Main"
                  className="w-48 h-32 object-cover rounded border mb-2"
                />
              )}
              <ul>
                <li><strong>Name:</strong> {space?.spaceName}</li>
                <li><strong>Location:</strong> {space?.city}, {space?.state}</li>
                <li><strong>Type:</strong> {space?.spaceType}</li>
                <li><strong>Units:</strong> {space?.unit}</li>
                <li><strong>Occupied:</strong> {space?.occupiedUnits}</li>
                <li><strong>Availability:</strong> {space?.availability}</li>
              </ul>
            </Section>
          </div>
        )}
      </main>
    </div>
  );
}

const Section = ({ title, children }) => (
  <div>
    <h2 className="font-medium mb-2">{title}</h2>
    <div className="text-sm">{children}</div>
  </div>
);
