import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

export default function SpaceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [space, setSpace] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleDelete = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/spaces/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        navigate('/');
      } else {
        console.error('Failed to delete space');
      }
    } catch (error) {
      console.error('Error deleting space:', error);
    }
  };
  
  useEffect(() => {
    const fetchSpace = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/spaces/${id}`);
        const data = await response.json();
        setSpace(data);
      } catch (error) {
        console.error('Error fetching space details:', error);
      }
    };
    fetchSpace();
  }, [id]);

  if (!space) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-full w-screen bg-white text-black flex flex-col lg:flex-row overflow-hidden">
      {/* Sidebar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 md:px-6 py-6 ml-0 lg:ml-64">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-sm text-black "
        >
          Back
        </button>
        <button
  onClick={() => navigate(`/space/${id}/edit`)}
  className="text-xs ml-[80%] text-white bg-black px-4 py-2 rounded-md w-fit "
>
  Edit Space
</button>

        <div className="flex mt-[3%] flex-col md:flex-row gap-8">
          {/* Image */}
          <div className="w-full md:w-1/3">
            {/* <div className="w-full h-64 overflow-hidden rounded-md bg-gray-100">
              {space.mainPhoto ? (
                <img
                  src={`http://localhost:3000/uploads/${space.mainPhoto}`}
                  alt="Main Photo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                  No Image
                </div>
              )}
            </div> */}
            <div className="w-full grid grid-cols-2 gap-4">
  {/* Main Photo */}
  {space.mainPhoto && (
    <div className="h-48 overflow-hidden rounded-md bg-gray-100">
      <img
        src={`http://localhost:3000/uploads/${space.mainPhoto}`}
        alt="Main Photo"
        className="w-full h-full object-cover"
      />
    </div>
  )}

  {/* Long Shot */}
  {space.longShot && (
    <div className="h-48 overflow-hidden rounded-md bg-gray-100">
      <img
        src={`http://localhost:3000/uploads/${space.longShot}`}
        alt="Long Shot"
        className="w-full h-full object-cover"
      />
    </div>
  )}

  {/* Close Shot */}
  {space.closeShot && (
    <div className="h-48 overflow-hidden rounded-md bg-gray-100">
      <img
        src={`http://localhost:3000/uploads/${space.closeShot}`}
        alt="Close Shot"
        className="w-full h-full object-cover"
      />
    </div>
  )}

  {/* Other Photos */}
  {space.otherPhotos && space.otherPhotos.length > 0 &&
    space.otherPhotos.map((photo, index) => (
      <div key={index} className="h-48 overflow-hidden rounded-md bg-gray-100">
        <img
          src={`http://localhost:3000/uploads/${photo}`}
          alt={`Other Photo ${index + 1}`}
          className="w-full h-full object-cover"
        />
      </div>
    ))
  }
</div>

          </div>

          {/* Details */}
          <div className="flex-1 flex flex-col gap-4">
            <div className='flex'>
            <h1 className="text-2xl font-bold">{space.spaceName}</h1>
            {/* <button
  onClick={() => navigate(`/space/${id}/edit`)}
  className="text-xs ml-auto text-white bg-black hover:bg-purple-700 px-4 py-2 rounded-md w-fit mr-[10%]"
>
  Edit Space
</button> */}
            </div>
            

            <p className="text-sm text-gray-600">{space.address}, {space.city}, {space.state}</p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Category:</strong> {space.category}</div>
              <div><strong>Space Type:</strong> {space.spaceType}</div>
              <div><strong>Price:</strong> ₹{space.price}</div>
              <div><strong>Footfall:</strong> {space.footfall}</div>
              <div><strong>Audience:</strong> {space.audience}</div>
              <div><strong>Demographics:</strong> {space.demographics}</div>
              <div><strong>Zone:</strong> {space.zone}</div>
              <div><strong>Facing:</strong> {space.facing}</div>
              <div><strong>Facia Towards:</strong> {space.faciaTowards}</div>
              <div><strong>Tier:</strong> {space.tier}</div>
              <div><strong>Latitude:</strong> {space.latitude}</div>
              <div><strong>Longitude:</strong> {space.longitude}</div>
            </div>

            <div className="mt-4">
              <h2 className="text-lg font-semibold">Description</h2>
              <p className="text-sm text-gray-700">{space.description}</p>
            </div>
          </div>
        </div>
        <div className="flex  text-xs gap-4 mt-6">


  <button
    onClick={() => setShowModal(true)}
    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
  >
    Delete Space
  </button>
</div>

      </main>
      {showModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-md p-6 w-96 flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-gray-800">Confirm Deletion</h2>
      <p className="text-sm text-gray-600">Are you sure you want to delete this space? This action cannot be undone.</p>

      <div className="flex justify-end gap-4 mt-4">
        <button
          onClick={() => setShowModal(false)}
          className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
        >
          Cancel
        </button>

        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
