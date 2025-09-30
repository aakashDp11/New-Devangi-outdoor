

import React, { useEffect, useState } from 'react';
import axios from 'axios';

/**
 * Props:
 * - spaceId:    ObjectId of Space
 * - campaignId: ObjectId of Campaign associated to the pipeline (required for DOOH)
 * - unitId:     Number (1..unit) optional; if omitted, first unit of this campaign is used
 * - onClose:    function
 */
export default function IsLiveStatusView({ spaceId, campaignId, unitId, onClose }) {
  const [liveInfo, setLiveInfo] = useState(null); // single unit info (or null)

  useEffect(() => {
    const fetchLiveStatus = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${spaceId}`);
        const ds = res.data?.digitalStatus;
        console.log("res data is",res.data.digitalStatus);
        // If DOOH: digitalStatus is an array with campaignId/unitId
        if (Array.isArray(ds)) {
          let target = null;
          console.log("unit id is",unitId);
          if (unitId != null && campaignId) {
            // exact unit + campaign match
            target = ds.find(
              u =>
                Number(u.unitId) === Number(unitId) &&
                String(u.campaignId) === String(campaignId)
            );
          }
         console.log("target is",target);
          if (!target && campaignId) {
            // fall back: first entry for this campaign
            target = ds.find(u => String(u.campaignId) === String(campaignId));
          }

          setLiveInfo(target || null);
        } else if (ds) {
          // Non-DOOH (legacy): treat as single object
          setLiveInfo(ds);
        } else {
          setLiveInfo(null);
        }
      } catch (error) {
        console.error('Failed to fetch live status:', error);
        setLiveInfo(null);
      }
    };

    if (spaceId) fetchLiveStatus();
  }, [spaceId, campaignId, unitId]);

  // Helper: decide if information is "filled" for the selected unit
  const hasAnyInfo =
    !!liveInfo &&
    (
      liveInfo.isLive ||
      liveInfo.confirmed ||
      (liveInfo.goLiveDate && liveInfo.goLiveDate.trim() !== '') ||
      (liveInfo.assignedPerson && liveInfo.assignedPerson.trim() !== '') ||
      (liveInfo.assignedAgency && liveInfo.assignedAgency.trim() !== '') ||
      (liveInfo.note && liveInfo.note.trim() !== '')
    );

  // Empty state (ask to fill info for the corresponding unit)
  if (!liveInfo || !hasAnyInfo) {
    return (
      <div className="text-sm text-gray-600 text-center py-6">
        {/* Keep same UI/UX block style and button; just tailor the message */}
        {unitId != null
          ? `Live status not confirmed yet for Unit ${unitId}. Please fill the information.`
          : 'Live status not confirmed yet for this campaign/unit. Please fill the information.'}

        <div className="mt-4">
          <button
            onClick={onClose}
            className="text-xs bg-gray-300 text-black py-2 px-6 rounded-xl hover:bg-gray-400 transition duration-200"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Show details for the single, corresponding unit only (same card UI)
  return (
    <div className="max-w-2xl w-full mx-auto mt-2 bg-white">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 text-center">Is Live</h2>
      <div className="space-y-4 text-sm text-gray-700 text-center">
        <div
          key={liveInfo.unitId ?? 'single'}
          className="p-4 mb-2 border rounded-lg bg-green-50 shadow-sm"
        >
          <p className="text-green-700 font-medium">
            {/* Preserve success line style; only show check if isLive=true */}
            {liveInfo.isLive
              ? `✅ ${liveInfo.unitId ? `Unit ${liveInfo.unitId}` : 'This space'} is live.`
              : `⏳ ${liveInfo.unitId ? `Unit ${liveInfo.unitId}` : 'This space'} is not live yet.`}
          </p>

          {liveInfo.goLiveDate && (
            <p>
              <span className="font-medium">Go Live Date:</span> {liveInfo.goLiveDate}
            </p>
          )}
          {liveInfo.assignedPerson && (
            <p>
              <span className="font-medium">Assigned Person:</span> {liveInfo.assignedPerson}
            </p>
          )}
          {liveInfo.assignedAgency && (
            <p>
              <span className="font-medium">Assigned Agency:</span> {liveInfo.assignedAgency}
            </p>
          )}
          {liveInfo.note && (
            <p>
              <span className="font-medium">Note:</span> {liveInfo.note}
            </p>
          )}
        </div>

        <div className="flex mt-4">
          <button
            onClick={onClose}
            className="w-[40%] mx-auto text-xs bg-gray-300 text-black py-2 rounded-xl hover:bg-gray-400 transition duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
