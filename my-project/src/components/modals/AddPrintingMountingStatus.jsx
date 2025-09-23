import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

export default function AddPrintingMountingStatus({ campaignId, spaceId, onConfirm, onClose, existingData }) {
  const [view, setView] = useState('form');
  const [printingDate, setPrintingDate] = useState('');
  const [note, setNote] = useState('');
  const [printingMaterial, setPrintingMaterial] = useState('');
  const [assignedPerson, setAssignedPerson] = useState('');
  const [assignedAgency, setAssignedAgency] = useState('');
  
  const username = localStorage.getItem('userName');
  const useremail = localStorage.getItem('userEmail');
  const userId = localStorage.getItem('userId');

//   useEffect(() => {
//     if (existingData && existingData.confirmed) {
//       setView('summary');
//       setPrintingDate(existingData.printingDate ? new Date(existingData.printingDate).toISOString().split('T')[0] : '');
//       setAssignedAgency(existingData.assignedAgency || '');
//       setAssignedPerson(existingData.assignedPerson || '');
//       setPrintingMaterial(existingData.printingMaterial || '');
//       setNote(existingData.note || '');
//     } else {
//       setView('form');
//     }
//   }, [existingData]);

  const handleSave = async () => {
    if (!printingDate || !assignedPerson || !assignedAgency || !printingMaterial) {
      toast.error('Please fill all mandatory fields before saving.');
      return;
    }

    const newPrintingStatus = {
      confirmed: true,
      printingDate,
      assignedPerson,
      assignedAgency,
      printingMaterial,
      note,
    };

    const changeLogData = {
      campaignId,
      userId,
      changeType: 'Printing Status Update',
      userName: username,
      userEmail: useremail,
      previousValue: existingData,
      newValue: newPrintingStatus,
    };

    try {
      await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${spaceId}/printingStatus`, newPrintingStatus);
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/change-Log`, changeLogData);
      
      toast.success('Printing status saved successfully!');
      onConfirm();
    } catch (err) {
      console.error('Failed to confirm printing status:', err);
      toast.error('Failed to save printing status.');
    }
  };

  const RedAsterisk = () => <span className="text-red-500 ml-1">*</span>;



  return (
    <div className="max-w-4xl w-full mx-auto p-6 bg-white rounded-lg">
    Working
    </div>
  );
}