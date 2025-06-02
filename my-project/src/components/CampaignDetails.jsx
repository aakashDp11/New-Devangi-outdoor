

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from './Navbar';
import CampaignPipeline from './CampaignPipeline';
import { PieChart } from '@mui/x-charts/PieChart';

export default function CampaignDetails() {
  const { id } = useParams();
  const [campaignData, setCampaignData] = useState(null);
  const [pipelineData, setPipelineData] = useState(null);
  const [spaceDetails, setSpaceDetails] = useState([]);
  const [activeTab, setActiveTab] = useState('Pipeline');

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/bookings/campaign/${id}`);
        const data = await res.json();
        setCampaignData(data);

        const fetchedSpaces = await Promise.all(
          (data.spaces || []).map(async (space) => {
            const res = await fetch(`http://localhost:3000/api/spaces/${space.id}`);
            const details = await res.json();
            return { ...details, selectedUnits: space.selectedUnits };
          })
        );
        setSpaceDetails(fetchedSpaces);
      } catch (err) {
        console.error('Failed to load campaign details:', err);
      }
    };

    fetchCampaign();
  }, [id]);

  useEffect(() => {
    const fetchPipelineData = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/pipeline/campaign/${id}`);
        const data = await res.json();
        setPipelineData(data);
      } catch (err) {
        console.error('Failed to load pipeline data:', err);
      }
    };

    if (campaignData?._id) {
      fetchPipelineData();
    }
  }, [campaignData]);

  if (!campaignData) return <div className="p-6">Loading campaign...</div>;

  const { campaignName, description, startDate, endDate } = campaignData;
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-IN');

  return (
    <div className="text-xs w-full">
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

        {/* Pipeline Tab */}
        {activeTab === 'Pipeline' && (
          <div className="w-full">
            <CampaignPipeline campaignId={campaignData._id} />
          </div>
        )}

        {/* Data Tab */}
        {activeTab === 'Data' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-[5%]">
            {/* Campaign Info with Payment Chart */}
            <div className="bg-white shadow-md border rounded-xl p-4">
              <h2 className="text-base font-semibold mb-2">Campaign Info</h2>
              <p className="text-sm"><strong>Description:</strong> {description}</p>
              <p className="text-sm"><strong>Start Date:</strong> {formatDate(startDate)}</p>
              <p className="text-sm"><strong>End Date:</strong> {formatDate(endDate)}</p>

              {pipelineData?.payment && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold mb-1">Payment Overview</h3>
                  <div className="w-[200px]">
                    <PieChart
                      series={[
                        {
                          data: [
                            { id: 0, value: pipelineData.payment.totalPaid, label: 'Paid' },
                            { id: 1, value: pipelineData.payment.paymentDue, label: 'Due' }
                          ],
                          innerRadius: 50,
                          outerRadius: 80,
                        },
                      ]}
                      width={200}
                      height={200}
                    />
                    <div className="text-xs mt-2">
                      <p><strong>Total:</strong> ₹{pipelineData.payment.totalAmount || 0}</p>
                      <p><strong>Paid:</strong> ₹{pipelineData.payment.totalPaid || 0}</p>
                      <p><strong>Due:</strong> ₹{pipelineData.payment.paymentDue || 0}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Space Info Cards */}
            {spaceDetails.map((space, index) => (
              <div key={space._id || index} className="bg-white shadow-md border rounded-xl p-4">
                <h2 className="text-base font-semibold mb-2">Space {index + 1}</h2>
                {space.mainPhoto && (
                  <img
                    src={space.mainPhoto}
                    alt="Main"
                    className="w-48 h-32 object-cover rounded border mb-2"
                  />
                )}
                <div className="text-sm space-y-1">
                  <p><strong>Name:</strong> {space.spaceName}</p>
                  <p><strong>Location:</strong> {space.city}, {space.state}</p>
                  <p><strong>Type:</strong> {space.spaceType}</p>
                  <p><strong>Total Units:</strong> {space.unit}</p>
                  <p><strong>Occupied Units:</strong> {space.occupiedUnits}</p>
                  <p><strong>Selected Units:</strong> {space.selectedUnits}</p>
                  <p><strong>Availability:</strong> {space.availability}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}



