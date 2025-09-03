

import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

export default function DigitalStatusForm({
  campaignId,
  spaceId,
  unit = 1,          // total units on this DOOH space
  onConfirm,
  onClose,
  existingData       // array (recommended) or object of digital status entries for this *space*
}) {
  // Selected unit (1..unit)
  const [unitId, setUnitId] = useState(1);

  // Form fields
  const [view, setView] = useState('form');
  const [goLiveDate, setGoLiveDate] = useState('');
  const [note, setNote] = useState('');
  const [assignedPerson, setAssignedPerson] = useState('');
  const [assignedAgency, setAssignedAgency] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [isLive, setIsLive] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [availability, setAvailability] = useState({ totalUnits: Number(unit || 1), free: [], taken: [] });
  const [loadingAvail, setLoadingAvail] = useState(true);

  // user info (for changelog)
  const username = localStorage.getItem('userName');
  const useremail = localStorage.getItem('userEmail');
  const userId = localStorage.getItem('userId');

  // Prevent auto-picking twice (existingData vs availability)
  const pickedUnitRef = useRef(false);

  // 🔒 Filter to THIS campaign only
  const campaignExisting = useMemo(() => {
    const ds = existingData;
    if (Array.isArray(ds)) {
      return ds.filter(d => String(d?.campaignId || '') === String(campaignId));
    }
    if (ds && typeof ds === 'object') {
      return String(ds.campaignId || '') === String(campaignId) ? [ds] : [];
    }
    return [];
  }, [existingData, campaignId]);

  // Fast lookup: does THIS campaign already have data for unit u?
  const hasExistingFor = useMemo(() => {
    const set = new Set(campaignExisting.map(d => Number(d?.unitId)));
    return (u) => set.has(Number(u));
  }, [campaignExisting]);

  // Pick the record for the currently selected unit (this campaign only)
  const currentUnitData = useMemo(
    () => campaignExisting.find(d => Number(d?.unitId) === Number(unitId)),
    [campaignExisting, unitId]
  );

  // 1) Prefer the campaign’s saved units when data arrives
  useEffect(() => {
    if (pickedUnitRef.current) return;

    if (campaignExisting.length > 0) {
      const firstWithData = [...campaignExisting]
        .map(d => Number(d?.unitId))
        .filter(Number.isFinite)
        .sort((a, b) => a - b)[0];

      if (firstWithData) {
        setUnitId(firstWithData);
        pickedUnitRef.current = true;
      }
    }
  }, [campaignExisting]);

  // 2) Availability fetch; only pick "first free" if nothing for this campaign
  useEffect(() => {
    const run = async () => {
      try {
        setLoadingAvail(true);
        const base = import.meta.env.VITE_API_BASE_URL;
        // Expecting payload: { totalUnits, free: number[], taken: number[] }
        const { data } = await axios.get(`${base}/api/pipeline/campaign/${campaignId}/availability/${spaceId}`);

        const totalUnits = Math.max(1, Number(data?.totalUnits || unit || 1));
        const free = Array.isArray(data?.free) ? data.free : [];
        const taken = Array.isArray(data?.taken) ? data.taken : [];

        setAvailability({ totalUnits, free, taken });

        if (!pickedUnitRef.current) {
          const hasAnyExisting = campaignExisting.length > 0;
          if (!hasAnyExisting) {
            const firstFree = free[0];
            if (firstFree) {
              setUnitId(firstFree);
              pickedUnitRef.current = true;
            }
          }
        }
      } catch {
        // fallback: just assume all units selectable up to 'unit'
        setAvailability({ totalUnits: Math.max(1, Number(unit || 1)), free: [], taken: [] });
      } finally {
        setLoadingAvail(false);
      }
    };

    if (campaignId && spaceId) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, spaceId]);

  // 3) Hydrate form from selected unit record (this campaign only)
  useEffect(() => {
    const d = currentUnitData || {};
    setConfirmed(!!d.confirmed);
    setIsLive(!!d.isLive);
    setGoLiveDate(d.goLiveDate ? new Date(d.goLiveDate).toISOString().split('T')[0] : '');
    setAssignedAgency(d.assignedAgency || '');
    setAssignedPerson(d.assignedPerson || '');
    setNote(d.note || '');
    setView(d.confirmed ? 'summary' : 'form');
  }, [currentUnitData]);

  const handleSave = async () => {
    // Basic validations
    if (!unitId || unitId < 1 || unitId > Number(unit || 1)) {
      toast.error('Invalid unit selected.');
      return;
    }

    // Block saving into a unit taken by others, but allow if this unit already belongs to this campaign
    if (availability.taken.includes(Number(unitId)) && !currentUnitData) {
      toast.error(`Unit ${unitId} is already allocated to another campaign. Please pick a free unit.`);
      return;
    }

    if (!goLiveDate || !assignedPerson || !assignedAgency) {
      toast.error('Please complete all required fields');
      return;
    }

    const newValue = {
      unitId: Number(unitId),
      campaignId,                  // <- send campaignId too
      confirmed: !!confirmed,
      isLive: !!isLive,
      goLiveDate,                  // 'YYYY-MM-DD'
      assignedPerson,
      assignedAgency,
      note
    };

    const changeLog = {
      campaignId,
      userId,
      userName: username,
      userEmail: useremail,
      changeType: `Digital Status Update (Unit ${unitId})`,
      previousValue: currentUnitData || null,
      newValue
    };

    const base = import.meta.env.VITE_API_BASE_URL;
    const url = `${base}/api/pipeline/campaign/${campaignId}/digital-status/${spaceId}/${unitId}`;

    try {
      setIsSaving(true);
      await axios.put(url, newValue);
      await axios.post(`${base}/api/pipeline/change-Log`, changeLog);

      toast.success('Digital status saved successfully!');
      onConfirm?.();
    } catch (err) {
      console.error('Failed to save digital status:', err);
      const msg = err?.response?.data?.message || 'Failed to save digital status.';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const RedAsterisk = () => <span className="text-red-500 ml-1">*</span>;

  // SUMMARY VIEW
  if (view === 'summary') {
    return (
      <div className="max-w-2xl w-full mx-auto p-6 bg-white rounded-lg">
        <h2 className="text-2xl font-semibold mb-6 text-green-700 text-center">
          Digital Status (Unit {unitId})
        </h2>

        {/* Unit selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
          <select
            value={unitId}
            onChange={(e) => setUnitId(Number(e.target.value))}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: Math.max(1, Number(availability.totalUnits || unit || 1)) }, (_, i) => i + 1).map(n => {
              const isTakenByOthers = availability.taken.includes(n) && !hasExistingFor(n);
              return (
                <option key={n} value={n} disabled={isTakenByOthers}>
                  {n}{hasExistingFor(n) ? ' (yours)' : isTakenByOthers ? ' (taken)' : ''}
                </option>
              );
            })}
          </select>
          {loadingAvail && <p className="text-xs text-gray-500 mt-1">Checking availability…</p>}
        </div>

        <div className="space-y-4 text-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-left bg-gray-50 p-4 rounded-lg">
            <p><span className="font-medium">Confirmed:</span> {confirmed ? 'Yes' : 'No'}</p>
            <p><span className="font-medium">Is Live:</span> {isLive ? 'Yes' : 'No'}</p>
            {goLiveDate && <p><span className="font-medium">Go Live Date:</span> {goLiveDate}</p>}
            {assignedPerson && <p><span className="font-medium">Assigned Person:</span> {assignedPerson}</p>}
            {assignedAgency && <p><span className="font-medium">Assigned Agency:</span> {assignedAgency}</p>}
            {note && <p className="md:col-span-2"><span className="font-medium">Note:</span> {note}</p>}
          </div>

          <div className="flex justify-center gap-3 mt-6">
            <button
              onClick={() => setView('form')}
              className="w-1/3 text-sm bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Edit
            </button>
            <button
              onClick={onClose}
              className="w-1/3 text-sm bg-gray-300 text-black py-2 rounded-lg hover:bg-gray-400 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // FORM VIEW
  return (
    <div className="max-w-2xl w-full mx-auto p-6 bg-white rounded-lg">
      <h2 className="text-2xl font-semibold mb-6 text-gray-800 text-center">
        {currentUnitData ? `Edit Digital Status (Unit ${unitId})` : `Digital Status (Unit ${unitId})`}
      </h2>

      {/* Unit selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
        <select
          value={unitId}
          onChange={(e) => setUnitId(Number(e.target.value))}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Array.from({ length: Math.max(1, Number(availability.totalUnits || unit || 1)) }, (_, i) => i + 1).map(n => {
            const isTakenByOthers = availability.taken.includes(n) && !hasExistingFor(n);
            return (
              <option key={n} value={n} disabled={isTakenByOthers}>
                {n}{hasExistingFor(n) ? ' (yours)' : isTakenByOthers ? ' (taken)' : ''}
              </option>
            );
          })}
        </select>
        {loadingAvail && <p className="text-xs text-gray-500 mt-1">Checking availability…</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {/* Confirmed */}
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirmed</label>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span className="text-sm text-gray-700">Mark as confirmed</span>
          </div>
        </div>

        {/* Is Live */}
        <div className="md:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Is Live</label>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isLive}
              onChange={(e) => setIsLive(e.target.checked)}
            />
            <span className="text-sm text-gray-700">Mark unit as live</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Go Live Date <RedAsterisk />
          </label>
          <input
            type="date"
            value={goLiveDate}
            onChange={(e) => setGoLiveDate(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assigned Person <RedAsterisk />
          </label>
          <input
            type="text"
            placeholder="Enter name"
            value={assignedPerson}
            onChange={(e) => setAssignedPerson(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assigned Agency <RedAsterisk />
          </label>
          <input
            type="text"
            placeholder="Enter agency name"
            value={assignedAgency}
            onChange={(e) => setAssignedAgency(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (if any)</label>
          <input
            type="text"
            placeholder="Add any relevant notes..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-center gap-4 mt-8">
        <button
          onClick={onClose}
          className="w-1/3 text-sm bg-gray-300 text-black py-2 rounded-lg hover:bg-gray-400 transition"
        >
          Close
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-1/3 text-sm bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
