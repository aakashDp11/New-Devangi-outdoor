


// import React, { useState, useEffect } from 'react';
// import axios from 'axios';

// export default function PrintingStatus({ spaceId, onConfirm }) {
//   const [printingStatus, setPrintingStatus] = useState(false);
//   const [alreadyConfirmed, setAlreadyConfirmed] = useState(false);

//   // ✅ Fetch space status once when component mounts to ensure fresh status
//   useEffect(() => {
//     const fetchSpaceStatus = async () => {
//       try {
//         const res = await axios.get(`http://localhost:3000/api/spaces/${spaceId}`);
//         if (res.data?.printingStatus?.confirmed) {
//           setAlreadyConfirmed(true);
//         }
//       } catch (error) {
//         console.error('Failed to fetch space printing status:', error);
//       }
//     };

//     if (spaceId) {
//       fetchSpaceStatus();
//     }
//   }, [spaceId]);

//   const handleSave = async () => {
//     try {
//       await axios.put(`http://localhost:3000/api/spaces/${spaceId}/printingStatus`);
//       setAlreadyConfirmed(true);
//       onConfirm();
//     } catch (err) {
//       console.error('Failed to confirm printing status:', err);
//     }
//   };

//   return (
//     <div className="max-w-xl mx-auto mt-10 bg-white p-6">
//       <h2 className="text-2xl font-semibold mb-4 text-gray-800">Printing done</h2>

//       {alreadyConfirmed ? (
//         <p className="text-green-700 font-semibold">✅ Printing already confirmed for this space.</p>
//       ) : (
//         <>
//           <div className="flex text-xs items-center space-x-3 mb-4">
//             <input
//               id="printingCheckbox"
//               type="checkbox"
//               checked={printingStatus}
//               onChange={() => setPrintingStatus(!printingStatus)}
//               className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
//             />
//             <label htmlFor="printingCheckbox" className="text-gray-700 text-sm">Yes?</label>
//           </div>

//           <button
//             onClick={handleSave}
//             disabled={!printingStatus}
//             className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition"
//           >
//             Save
//           </button>
//         </>
//       )}
//     </div>
//   );
// }

import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function PrintingStatus({ spaceId, onConfirm, onClose }) {
  const [printingStatus, setPrintingStatus] = useState(false);
  const [printingDate, setPrintingDate] = useState('');
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false);

  useEffect(() => {
    const fetchSpaceStatus = async () => {
      try {
        const res = await axios.get(`http://localhost:3000/api/spaces/${spaceId}`);
        if (res.data?.printingStatus?.confirmed) {
          setAlreadyConfirmed(true);
          setPrintingDate(res.data.printingStatus.printingDate || '');
        }
      } catch (error) {
        console.error('Failed to fetch space printing status:', error);
      }
    };

    if (spaceId) fetchSpaceStatus();
  }, [spaceId]);

  const handleSave = async () => {
    try {
      if (!printingStatus || !printingDate) {
        alert('Please confirm printing and select printing date.');
        return;
      }

      await axios.put(`http://localhost:3000/api/spaces/${spaceId}/printingStatus`, {
        confirmed: true,
        printingDate,
      });

      setAlreadyConfirmed(true);
      onConfirm();
    } catch (err) {
      console.error('Failed to confirm printing status:', err);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 bg-white  ">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 text-center">Printing Status</h2>

      {alreadyConfirmed ? (
        <div className="space-y-4 text-sm text-gray-700 text-center">
          <p className="text-green-700 font-medium">✅ Printing already confirmed for this space.</p>
          {printingDate && (
            <p>
              <span className="font-medium">Printing Date:</span> {printingDate}
            </p>
          )}
          <div className="flex mt-4">
            <button
              onClick={onClose}
              className="w-[40%] mx-auto text-xs bg-gray-300 text-black py-2 rounded-xl hover:bg-gray-400 transition duration-200"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center space-x-3 mb-4 text-sm">
            <input
              id="printingCheckbox"
              type="checkbox"
              checked={printingStatus}
              onChange={() => setPrintingStatus(!printingStatus)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="printingCheckbox" className="text-gray-700 font-medium">
              Printing Completed?
            </label>
          </div>

          {printingStatus && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Printing Date</label>
                <input
                  type="date"
                  value={printingDate}
                  onChange={(e) => setPrintingDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex">
                <button
                  onClick={onClose}
                  className="w-[40%] mr-auto text-xs bg-gray-300 text-black py-2 rounded-xl hover:bg-gray-400 transition duration-200"
                >
                  Close
                </button>
                <button
                  onClick={handleSave}
                  className="w-[40%] text-xs bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition duration-200"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {!printingStatus && (
            <div className="flex mt-4 w-full">
              <button
                onClick={onClose}
                className="mx-auto text-xs bg-gray-300 text-black py-2 rounded-xl hover:bg-gray-400 transition duration-200"
              >
                Close
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
