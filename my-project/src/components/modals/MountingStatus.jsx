

// import React, { useState, useContext } from 'react';
// import axios from 'axios';
// import { PipelineContext } from '../../context/PipelineContext';

// export default function MountingStatus({ bookingId, onConfirm }) {
//   const [mountingStatus, setMountingStatus] = useState(false);
//   const { pipelineData, setPipelineData } = useContext(PipelineContext);

//   const handleSave = async () => {
//     try {
//       const res = await axios.put(`http://localhost:3000/api/pipeline/${bookingId}/mountingStatus`, {
//         confirmed: true
//       });
//       setPipelineData(res.data);
//       onConfirm();
//     } catch (err) {
//       console.error('Failed to confirm mounting status:', err);
//     }
//   };

//   return (
//     <div>
//       {pipelineData?.mountingStatus?.confirmed ? (
//         <h1>Mounting done</h1>
//       ) : (
//         <div className="max-w-xl mx-auto mt-10 bg-white  p-6 ">
//           <h2 className="text-2xl font-semibold mb-4 text-gray-800">Mounting done</h2>

//           <div className="flex text-xs items-center space-x-3 mb-4">
//             <input
//               id="mountingCheckbox"
//               type="checkbox"
//               checked={mountingStatus}
//               onChange={() => setMountingStatus(!mountingStatus)}
//               className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
//             />
//             <label htmlFor="mountingCheckbox" className="text-gray-700 text-sm">
//               Yes?
//             </label>
//           </div>

//           <button
//             onClick={handleSave}
//             className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition"
//           >
//             Save
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function MountingStatus({ spaceId, onConfirm }) {
  const [mountingStatus, setMountingStatus] = useState(false);
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false);

  // ✅ Fetch space mounting status on mount to ensure fresh data
  useEffect(() => {
    const fetchSpaceStatus = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/spaces/${spaceId}`);
        if (res.data?.mountingStatus?.confirmed) {
          setAlreadyConfirmed(true);
        }
      } catch (error) {
        console.error('Failed to fetch space mounting status:', error);
      }
    };

    if (spaceId) {
      fetchSpaceStatus();
    }
  }, [spaceId]);

  const handleSave = async () => {
    try {
      await axios.put(`http://localhost:3000/api/spaces/${spaceId}/mountingStatus`);
      setAlreadyConfirmed(true);
      onConfirm();
    } catch (err) {
      console.error('Failed to confirm mounting status:', err);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Mounting done</h2>

      {alreadyConfirmed ? (
        <p className="text-green-700 font-semibold">✅ Mounting already confirmed for this space.</p>
      ) : (
        <>
          <div className="flex text-xs items-center space-x-3 mb-4">
            <input
              id="mountingCheckbox"
              type="checkbox"
              checked={mountingStatus}
              onChange={() => setMountingStatus(!mountingStatus)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="mountingCheckbox" className="text-gray-700 text-sm">Yes?</label>
          </div>

          <button
            onClick={handleSave}
            disabled={!mountingStatus}
            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Save
          </button>
        </>
      )}
    </div>
  );
}
