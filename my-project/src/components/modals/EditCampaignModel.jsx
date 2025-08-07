// 

import React, { useState, useEffect } from "react";
import { toast } from "sonner";

export default function EditCampaignModal({
  campaignData,
  pipelineSpaces = [],
  onClose,
  onUpdate,
}) {
  const [formData, setFormData] = useState({
    campaignName: "",
    description: "",
    startDate: "",
    endDate: "",
    industry: "",
  });
  const [dateError, setDateError] = useState("");

  useEffect(() => {
    if (campaignData) {
      setFormData({
        campaignName: campaignData.campaignName || "",
        description: campaignData.description || "",
        startDate: campaignData.startDate || "",
        endDate: campaignData.endDate || "",
        industry: campaignData.industry || "",
      });
    }
  }, [campaignData]);

  const handleChange = async (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...formData, [name]: value };
    setFormData(updatedForm);

    if (name === "startDate" || name === "endDate") {
      const newStart = new Date(
        name === "startDate" ? value : updatedForm.startDate
      );
      const newEnd = new Date(
        name === "endDate" ? value : updatedForm.endDate
      );

      if (!newStart || !newEnd || isNaN(newStart) || isNaN(newEnd)) return;

      try {
        for (const space of pipelineSpaces) {
          const [minDateStr, maxDateStr] = space.dates || [];
          const minDate = new Date(minDateStr);
          const maxDate = new Date(maxDateStr);

          if (newStart < minDate || newEnd > maxDate) {
            setDateError(
              `Dates must be between ${minDateStr} and ${maxDateStr} for ${space.spaceName}`
            );
            return;
          }

          const overlaps = (space.campaignDates || []).some((cd) => {
            // ✅ Skip the current campaign's own booking
            if (
              cd.campaignId === campaignData._id || // direct match
              cd.campaignId?._id === campaignData._id // populated ref match
            ) {
              return false;
            }

            const cStart = new Date(cd.startDate);
            const cEnd = new Date(cd.endDate);
            return !(newEnd < cStart || newStart > cEnd);
          });

          if (overlaps) {
            setDateError(
              `Selected dates overlap with existing bookings on ${space.spaceName}`
            );
            return;
          }
        }

        setDateError(""); // ✅ Valid
      } catch (err) {
        console.error(err);
        setDateError("Error validating dates. Try again.");
      }
    }
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/bookings/campaign/${campaignData._id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );

      if (!res.ok) throw new Error("Failed to update campaign");
      const updated = await res.json();
      toast.success("Campaign updated successfully");
      onUpdate(updated);
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update campaign");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6">
        <h2 className="text-lg font-semibold mb-4">Edit Campaign</h2>
        <div className="grid gap-4">
          <label>
            Campaign Name:
            <input
              name="campaignName"
              value={formData.campaignName}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </label>
          <label>
            Description:
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </label>
          <label>
            Start Date:
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </label>
          <label>
            End Date:
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </label>
          {dateError && (
            <p className="text-red-600 text-xs mt-1">{dateError}</p>
          )}
          {/* <label>
            Industry (Optional):
            <input
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </label> */}
        </div>
        <div className="flex justify-end mt-6 space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!!dateError}
            className={`px-4 py-2 rounded text-white ${
              dateError
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
