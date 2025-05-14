// import React, { useState } from 'react';
// import { useContext } from 'react';
// import { PipelineContext } from '../../context/PipelineContext';
// export default function PrintingStatus({ onConfirm }) {
//   const [printingStatus, setPrintingStatus] = useState(false);

//   const { pipelineData,setPipelineData } = useContext(PipelineContext);

 

//   const handleSave = () => {
//     //   alert(`PO Document "${poFile.name}" saved!`);
//       setPipelineData(prev => ({
//         ...prev,
//         printingStatus: { confirmed: true}
//       }));
//       onConfirm();
    
//   };

  

//   return (
//     <div>
//         {pipelineData?.printingStatus?.confirmed?<h1>Printing done</h1>: <div className="max-w-xl mx-auto mt-10 bg-white shadow-lg rounded-lg p-6 border">
//       <h2 className="text-2xl font-semibold mb-4 text-gray-800">Printing done</h2>

//       <div className="flex text-xs items-center space-x-3 mb-4">
//         <input
//           id="printingCheckbox"
//           type="checkbox"
//           checked={printingStatus}
//           onChange={() => setPrintingStatus(!printingStatus)}
//           className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
//         />
//         <label htmlFor="printingCheckbox" className="text-gray-700 text-sm">
//           Yes?
//         </label>
//       </div>

     
//       <button
//             onClick={handleSave}
//             className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition"
//           >
//             Save
//           </button>
//     </div>}
//     </div>
   
//   );
// }

import React, { useState, useContext } from 'react';
import axios from 'axios';
import { PipelineContext } from '../../context/PipelineContext';

export default function PrintingStatus({ bookingId, onConfirm }) {
  const [printingStatus, setPrintingStatus] = useState(false);
  const { pipelineData, setPipelineData } = useContext(PipelineContext);

  const handleSave = async () => {
    try {
      const res = await axios.put(`http://localhost:3000/api/pipeline/${bookingId}/printingStatus`, {
        confirmed: true
      });
      setPipelineData(res.data);
      onConfirm();
    } catch (err) {
      console.error('Failed to confirm printing status:', err);
    }
  };

  return (
    <div>
      {pipelineData?.printingStatus?.confirmed ? (
        <h1>Printing done</h1>
      ) : (
        <div className="max-w-xl mx-auto mt-10 bg-white  p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Printing done</h2>

          <div className="flex text-xs items-center space-x-3 mb-4">
            <input
              id="printingCheckbox"
              type="checkbox"
              checked={printingStatus}
              onChange={() => setPrintingStatus(!printingStatus)}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="printingCheckbox" className="text-gray-700 text-sm">
              Yes?
            </label>
          </div>

          <button
            onClick={handleSave}
            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition"
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}

