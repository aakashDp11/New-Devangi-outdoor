


// // DOOH working fine now


import React, { useCallback, useEffect, useState, useContext } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import BookingStatusForm from './modals/BookingStatusForm';
import POForm from './modals/PoStatus';
import ArtworkForm from './modals/ArtworkStatus';
import InvoiceForm from './modals/InvoiceDetailsForm';
import PaymentStatusForm from './modals/PaymentStatusForm';
import PrintingStatus from './modals/PrintingStatus';
import MountingStatus from './modals/MountingStatus';
import DigitalStatusForm from './modals/DigitalStatusForm';
import IsLiveStatusView from './modals/isLiveStatusView';
import { toast } from 'sonner';
import { PipelineContext } from '../context/PipelineContext';
import axios from 'axios';

const baseNodeStyle = {
  padding: 10,
  border: '2px solid',
  borderRadius: 8,
  fontWeight: 600,
  textAlign: 'center',
};

const formatTimestamp = (isoString) => {
  if (!isoString) return null;
  try {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    console.error("Invalid timestamp:", isoString);
    return null;
  }
};

const NodeLabel = ({ title, timestamp }) => (
  <div>
    <div>{title}</div>
    {timestamp && (
      <div style={{ fontSize: '9px', marginTop: '4px', color: '#4A5568', fontWeight: 400 }}>
        {timestamp}
      </div>
    )}
  </div>
);



const AddPrintingMountingStatusPlaceholder = ({ existingData, spaceId, spaceName, campaignId, pipelineData, onClose, onConfirm }) => {
  console.log("Existing data is", existingData);
  console.log("For space node spaceId is", spaceId);
  console.log("For space node spaceName is", spaceName);
  console.log("Full pipelineData for unitId calculation:", pipelineData);

  // Calculate max unitId from pipelineData.spaces for the given spaceId
  const currentSpace = pipelineData?.spaces?.find(s => s._id === spaceId);
  const maxUnitId = currentSpace?.printingStatus?.length > 0
    ? Math.max(...currentSpace.printingStatus.map(ps => ps.unitId)) + 1
    : 1; // If no existing printing statuses, start with 1
    
  console.log("Calculated maxUnitId:", maxUnitId);

  // State to hold temporary data for printing and mounting (for demonstration)
  const [printingDetails, setPrintingDetails] = useState({
    unitId: maxUnitId, // Set the calculated unitId here
    confirmed: false,
    completedAt: "", // Will be set on confirm if confirmed is true
    assignedAgency: "",
    assignedPerson: "",
    isLive: false,
    liveCompletedAt: "",
    printingDate:"",
    goLiveDate: "",
    note: "",
  });

  const [mountingDetails, setMountingDetails] = useState({
    unitId: maxUnitId, // Set the calculated unitId here
    confirmed: false,
    completedAt: "", // Will be set on confirm if confirmed is true
    assignedAgency: "",
    assignedPerson: "",
    isLive: false,
    liveCompletedAt: "",
    goLiveDate: "",
    mountingDate:"",
    note: "",
  });

  // Update unitId in state if maxUnitId changes (e.g., after initial render or refresh)
  useEffect(() => {
    setPrintingDetails(prev => ({ ...prev, unitId: maxUnitId }));
    setMountingDetails(prev => ({ ...prev, unitId: maxUnitId }));
  }, [maxUnitId]);


  const handleAddPrintingMounting = async () => {
    // Optionally set completedAt if confirmed
    const finalPrintingDetails = { ...printingDetails };
    if (finalPrintingDetails.confirmed && !finalPrintingDetails.completedAt) {
      finalPrintingDetails.completedAt = new Date().toISOString();
    }
    const finalMountingDetails = { ...mountingDetails };
    if (finalMountingDetails.confirmed && !finalMountingDetails.completedAt) {
      finalMountingDetails.completedAt = new Date().toISOString();
    }


    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/campaigns/add-statuses`,
        {
          printingStatus: finalPrintingDetails, // Use finalized details
          mountingStatus: finalMountingDetails, // Use finalized details
          campaignId: campaignId,
          spaceId: spaceId,
          unitId:maxUnitId
        }
      );

      if (response.status === 201) {
        toast.success('Printing and Mounting statuses added successfully!');
        onConfirm(); // Close modal and refresh pipeline
      } else {
        toast.error('Failed to add printing and mounting statuses.');
      }
    } catch (error) {
      console.error('Error adding printing/mounting statuses:', error);
      const errorMessage = error.response?.data?.error || 'Server error occurred.';
      toast.error(`Error: ${errorMessage}`);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Add Printing/Mounting Status for {spaceName}</h2>
      <p className="mb-2">This Inventory has been printed and mounted {currentSpace?.printingStatus?.length || 0} time(s).</p>
      <p className="mb-4 text-sm text-gray-700">Next Unit ID to be added: **{maxUnitId}**</p>

      {/* Placeholder for actual form inputs */}
      <div className="mb-4 text-sm text-gray-600 border p-3 rounded bg-gray-50">
        <p className="font-semibold">Placeholder Data to be Sent:</p>
        <p>Printing Unit ID: {printingDetails.unitId}</p>
        <p>Printing Agency: {printingDetails.assignedAgency}</p>
        <p>Mounting Unit ID: {mountingDetails.unitId}</p>
        <p>Mounting Agency: {mountingDetails.assignedAgency}</p>
      </div>
     
      <div className="flex justify-end mt-4 gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          Close
        </button>
        <button
          onClick={handleAddPrintingMounting}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Add Printing/Mounting
        </button>
      </div>
    </div>
  );
};
function CampaignPipelineInternal({ campaignId, isFOC }) {
  const { id } = useParams();
  const CampaignId = campaignId || id;
  const location = useLocation();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  // New state for the placeholder modal
  const [showAddPrintingMountingModal, setShowAddPrintingMountingModal] = useState(false);
  const [selectedSpaceNode, setSelectedSpaceNode] = useState(null);

  const { pipelineData, setPipelineData } = useContext(PipelineContext);
  const [spaces, setSpaces] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [campaignDigital, setCampaignDigital] = useState({}); 
  const { fitView } = useReactFlow();
  const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);
  const onNodeClick = (_, node) => {
    if (node.id.startsWith('inventory-')) {
      // If it's an inventory node, open the new placeholder modal
      setSelectedSpaceNode(node);
      setShowAddPrintingMountingModal(true);
    } else {
      // For other nodes, open their respective modals
      setSelectedNode(node);
    }
  };

 

const isNodeCompleted = (nodeId, space = null) => {
  // ... (existing booking, po, artwork, invoice, payment logic)
    if (nodeId === 'booking') return pipelineData?.bookingStatus?.confirmed;
    if (nodeId === 'po') return pipelineData?.po?.confirmed;
    if (nodeId === 'artwork') return pipelineData?.artwork?.confirmed;
    if (nodeId === 'invoice') {
      return Array.isArray(pipelineData?.invoice) &&
        pipelineData.invoice.length > 0 &&
        pipelineData.invoice.some(inv => inv.invoiceNumber);
    }
    if (nodeId === 'payment') return pipelineData?.payment?.payments?.length > 0;
    // if (nodeId.startsWith('print-')) return pipelineData.spaces?.printingStatus?.confirmed;
  // Handle unit-specific printing/mounting nodes
  if (nodeId.startsWith('print-') || nodeId.startsWith('mount-')) { // Only for print/mount
    const parts = nodeId.split('-'); // e.g., ['print', '68cd39371240ec5b46a34773', '1']
    const spaceId = parts[1];
    const unitId = parseInt(parts[2]); // Convert unitId to number

    const targetSpace = pipelineData.spaces?.find(s => s._id === spaceId);
    if (!targetSpace) return false;

    if (nodeId.startsWith('print-')) {
      const printStatus = targetSpace.printingStatus?.find(ps => ps.unitId === unitId);
      return printStatus?.confirmed;
    }
    if (nodeId.startsWith('mount-')) {
      const mountStatus = targetSpace.mountingStatus?.find(ms => ms.unitId === unitId);
      return mountStatus?.confirmed;
    }
  }
  // Original digital/live check (non-unit specific) for DOOH spaces
  if (nodeId.startsWith('digital-')) {
    const spaceId = nodeId.split('-')[1];
    const targetSpace = pipelineData.spaces?.find(s => s._id === spaceId);
    if (!targetSpace) return false;
    const ds = campaignDigital?.[spaceId] ? campaignDigital[spaceId][0] : null; // Assuming first entry for single node
    const currentCampaignId = String(pipelineData?.campaign?._id || '');
    return ds?.confirmed && String(ds.campaignId || '') === currentCampaignId;
  }
  if (nodeId.startsWith('live-')) {
    const spaceId = nodeId.split('-')[1];
    const targetSpace = pipelineData.spaces?.find(s => s._id === spaceId);
    if (!targetSpace) return false;
    const ds = campaignDigital?.[spaceId] ? campaignDigital[spaceId][0] : null; // Assuming first entry for single node
    const currentCampaignId = String(pipelineData?.campaign?._id || '');
    return ds?.isLive && String(ds.campaignId || '') === currentCampaignId;
  }

  return false;
};

// Inside getExistingDataForSelectedNode function:
const getExistingDataForSelectedNode = () => {
  if (!selectedNode || !pipelineData) return null;

  const { id } = selectedNode;
  const parts = id.split('-'); // e.g., ['print', '68cd39371240ec5b46a34773', '1']
  const spaceId = parts[1];
  const unitId = parts.length > 2 ? parseInt(parts[2]) : null; // Get unitId if present for unit-specific nodes

  // ... (existing booking, po, artwork, invoice, payment logic)

  const space = pipelineData.spaces.find(s => s._id === spaceId);
  console.log("Selected node is",space);
  if (!space) return null;

  // Unit-specific printing/mounting
  if (id.startsWith('print-')) {
    console.log("Return for printing data node is",space.printingStatus?.find(ps => ps.unitId === unitId));
    return space.printingStatus?.find(ps => ps.unitId === unitId) || null;
  }
  if (id.startsWith('mount-')) {
    return space.mountingStatus?.find(ms => ms.unitId === unitId) || null;
  }

  // Space-level digital/live (non-unit specific)
  if (id.startsWith('digital-')) {
    // Return the first digital status found for the space, or null
    return (campaignDigital?.[spaceId] && campaignDigital[spaceId].length > 0) ? campaignDigital[spaceId][0] : null;
  }
  // No separate fetch for 'live-', as it uses the same digital status object.

  return null;
};

//   if (!selectedNode || !pipelineData) return null;

//   const { id } = selectedNode;
//   const parts = id.split('-'); // e.g., ['print', '68cd39371240ec5b46a34773', '1']
//   const spaceId = parts[1];
//   const unitId = parts.length > 2 ? parseInt(parts[2]) : null; // Get unitId if present

//   // ... (existing booking, po, artwork, invoice, payment logic)

//   const space = pipelineData.spaces.find(s => s._id === spaceId);
//   if (!space) return null;

//   if (id.startsWith('print-')) {
//     return space.printingStatus?.find(ps => ps.unitId === unitId) || null;
//   }
//   if (id.startsWith('mount-')) {
//     return space.mountingStatus?.find(ms => ms.unitId === unitId) || null;
//   }
//   if (id.startsWith('digital-')) {
//     // For digital status, return the specific unit's status from the campaignDigital structure
//     const digitalStatusesForSpace = campaignDigital[spaceId] || [];
//     return digitalStatusesForSpace.find(ds => ds.unitId === unitId) || null;
//   }
//   // No need for a separate 'live-' fetch, as 'digital-' provides the same object.
//   // The IsLiveStatusView component can directly use the digital status object to show live info.

//   return null;
// };
  const getNodeStyle = (isComplete) => {
    console.log("Is complete",isComplete);
    const bgColor = isComplete ? '#d1fae5' : '#fef08a';
    return {
      ...baseNodeStyle,
      background: bgColor,
      borderColor: bgColor,
    };
  };

  useEffect(() => {
    const fetchOrCreatePipeline = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${CampaignId}`);
        console.log("Pipeline data", res.data);
        setPipelineData(res.data);
      } catch (err) {
        if (err.response?.status === 404) {
          const createRes = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${CampaignId}`);
          console.log("Pipeline data", createRes.data);
          setPipelineData(createRes.data);
        } else {
          console.error('Error fetching/creating pipeline:', err);
        }
      }
    };
    if (CampaignId) fetchOrCreatePipeline();
  }, [CampaignId, refreshKey, setPipelineData]);
 
  useEffect(() => {
    const fetchCampaignDigital = async () => {
      try {
        const url = `${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${CampaignId}/digital-status`;
        const res = await axios.get(url);
        const payload = res.data || {};
        console.log("Payload data is", payload);
  
        // Only replace if the server returned meaningful data
        const hasAny = payload && Object.values(payload).some(v => (Array.isArray(v) ? v.length : !!v));
        if (hasAny) {
          setCampaignDigital(payload);  // Set the response to campaignDigital
        } else if (pipelineData?.spaces?.length) {
          setCampaignDigital(buildCampaignDigitalFromPipeline(pipelineData, CampaignId));  // Fallback if no data
        }
      } catch {
        if (pipelineData?.spaces?.length) {
          setCampaignDigital(buildCampaignDigitalFromPipeline(pipelineData, CampaignId));
        } else {
          setCampaignDigital({});
        }
      }
    };
  
    if (CampaignId && pipelineData?.spaces?.length) {
      fetchCampaignDigital();  // Fetch campaign digital status
    }
  }, [CampaignId, pipelineData?.spaces?.length, refreshKey]);
  
  
  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${CampaignId}`);
        // const populatedSpaces = res.data.spaces.map(s => s.id);
        const populatedSpaces = (res.data.spaces || []).map(s => s._id);
        console.log("Space for this campaign pipeline", populatedSpaces);
        setSpaces(populatedSpaces);
      } catch (error) {
        console.error('Failed to fetch campaign spaces:', error);
      }
    };
    if (pipelineData?.artwork?.confirmed) {
      fetchSpaces();
    }
  }, [pipelineData?.artwork?.confirmed, CampaignId]);

  useEffect(() => {
    if (!pipelineData) return;

    let dynamicNodes = [];
    let dynamicEdges = [];

    const staticNodes = [
      {
        id: 'booking',
        data: { label: <NodeLabel title="Booking Confirmed" timestamp={formatTimestamp(pipelineData.bookingStatus?.completedAt)} /> },
        position: { x: 0, y: 200 },
        style: getNodeStyle(isNodeCompleted('booking')),
      },
    ];

    const staticEdges = [];

    if (pipelineData.bookingStatus?.confirmed) {
      staticNodes.push(
        {
          id: 'po',
          data: { label: <NodeLabel title="PO Status" timestamp={formatTimestamp(pipelineData.po?.completedAt)} /> },
          position: { x: 250, y: 200 },
          style: getNodeStyle(isNodeCompleted('po')),
        },
        {
          id: 'artwork',
          data: { label: <NodeLabel title="Artwork" timestamp={formatTimestamp(pipelineData.artwork?.completedAt)} /> },
          position: { x: 450, y: 200 },
          style: getNodeStyle(isNodeCompleted('artwork')),
        }
      );
      staticEdges.push(
        { id: 'e-booking-po', source: 'booking', target: 'po', markerEnd: 'arrowclosed' },
        { id: 'e-po-artwork', source: 'po', target: 'artwork', markerEnd: 'arrowclosed' }
      );

      if (!isFOC) {
        staticNodes.push({
          id: 'invoice',
          data: { label: <NodeLabel title="Invoice Details" timestamp={formatTimestamp(pipelineData.invoice?.[0]?.completedAt)} /> },
          position: { x: 250, y: 400 },
          style: getNodeStyle(isNodeCompleted('invoice')),
        });
        staticEdges.push({ id: 'e-po-invoice', source: 'po', target: 'invoice', markerEnd: 'arrowclosed' });
      }
    }

    if (!isFOC && Array.isArray(pipelineData.invoice) && pipelineData.invoice.some(inv => inv.invoiceNumber)) {
      staticNodes.push({
        id: 'payment',
        data: { label: <NodeLabel title="Payment Status" timestamp={formatTimestamp(pipelineData.payment?.payments?.[0]?.completedAt)} /> },
        position: { x: 450, y: 400 },
        style: getNodeStyle(isNodeCompleted('payment')),
      });
      staticEdges.push({
        id: 'e-invoice-payment',
        source: 'invoice',
        target: 'payment',
        markerEnd: 'arrowclosed',
      });
    }




if (pipelineData.artwork?.confirmed && pipelineData.spaces.length > 0) {
  pipelineData.spaces.forEach((space, spaceIndex) => { // Changed index to spaceIndex to avoid conflict
    const inventoryId = `inventory-${space._id}`;
    // Base Y position for this space's branch
    // This baseY needs to account for multiple print/mount nodes, so we'll adjust later
    // For now, let's just make sure the inventory node is positioned correctly relative to the top.
    const baseY = 100 + spaceIndex * 200;

    dynamicNodes.push({
      id: inventoryId,
      data: { label: space.spaceName },
      position: { x: 650, y: baseY },
      style: getNodeStyle(true), // Inventory node is always 'complete' if artwork is done
    });

    dynamicEdges.push({ id: `e-artwork-${space._id}`, source: 'artwork', target: inventoryId, markerEnd: 'arrowclosed' });

    if (space.spaceType === 'DOOH') {
      // KEEPING THE ORIGINAL DIGITAL STATUS LOGIC FOR NOW (single node per space)
      // If you later need to branch digital status by unit, we can revisit this.
      const digitalId = `digital-${space._id}`;
      const liveId = `live-${space._id}`;
      const ds = campaignDigital?.[space._id] ? campaignDigital[space._id][0] : null; // Assuming only the first digital status is relevant for the single node for now

      dynamicNodes.push(
        {
          id: digitalId,
          data: {
            label: (
              <NodeLabel
                title="Digital Agency"
                timestamp={formatTimestamp(ds?.confirmed ? ds.completedAt : null)}
              />
            )
          },
          position: { x: 850, y: baseY }, // Position relative to space's baseY
          style: getNodeStyle(isNodeCompleted(digitalId, space)),
        },
        {
          id: liveId,
          data: {
            label: (
              <NodeLabel
                title="Is Live"
                timestamp={formatTimestamp(ds?.isLive ? ds.liveCompletedAt : null)}
              />
            )
          },
          position: { x: 1050, y: baseY }, // Position relative to space's baseY
          style: getNodeStyle(isNodeCompleted(liveId, space)),
        }
      );

      dynamicEdges.push({
        id: `e-${inventoryId}-digital`,
        source: inventoryId,
        target: digitalId,
        markerEnd: 'arrowclosed'
      });

      if (ds?.confirmed) {
        dynamicEdges.push({
          id: `e-digital-${space._id}-live`,
          source: digitalId,
          target: liveId,
          markerEnd: 'arrowclosed'
        });
      }

    } else { // For 'Billboard' or other non-DOOH types (Printing/Mounting)
      // Iterate over the printingStatus array for each unit
      (space.printingStatus || []).forEach((printStatus, unitIndex) => {
        const unitId = printStatus.unitId;
        const printNodeId = `print-${space._id}-${unitId}`;
        const mountNodeId = `mount-${space._id}-${unitId}`;

        // Find corresponding mounting status for this unitId
        const mountStatus = (space.mountingStatus || []).find(ms => ms.unitId === unitId);

        // Adjust Y position for each unit's branch, relative to the inventory node's Y
        // This creates distinct vertical "lanes" for each unit
        const unitBranchY = baseY + (unitIndex * 150); // Offset each unit branch visually

        dynamicNodes.push(
          {
            id: printNodeId,
            data: { label: <NodeLabel title={`Printing (Unit ${unitId})`} timestamp={formatTimestamp(printStatus.completedAt)} /> },
            position: { x: 850, y: unitBranchY },
            style: getNodeStyle(printStatus.confirmed), // Use specific unit's confirmed status
          },
          {
            id: mountNodeId,
            data: { label: <NodeLabel title={`Mounting (Unit ${unitId})`} timestamp={formatTimestamp(mountStatus?.completedAt)} /> },
            position: { x: 1050, y: unitBranchY },
            style: getNodeStyle(mountStatus?.confirmed), // Use specific unit's confirmed status
          }
        );

        dynamicEdges.push(
          { id: `e-${inventoryId}-print-${unitId}`, source: inventoryId, target: printNodeId, markerEnd: 'arrowclosed' },
          { id: `e-print-${unitId}-mount-${unitId}`, source: printNodeId, target: mountNodeId, markerEnd: 'arrowclosed' }
        );
      });
    }
  });
}
    setNodes([...staticNodes, ...dynamicNodes]);
    setEdges([...staticEdges, ...dynamicEdges]);

    setTimeout(() => {
      fitView({ padding: 0.2, duration: 500 });
    }, 0);
  }, [pipelineData, spaces, isFOC, fitView, setNodes, setEdges,campaignDigital]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const openNodeId = params.get('open');

    if (openNodeId && nodes.length > 0) {
      const nodeToOpen = nodes.find((node) => node.id === openNodeId);

      if (nodeToOpen) {
        setSelectedNode(nodeToOpen);
        
        const newUrl = `${window.location.pathname}`;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [location.search, nodes]); 
  useEffect(() => {
    if (pipelineData?.spaces?.length) {
      const built = buildCampaignDigitalFromPipeline(pipelineData, CampaignId);
      setCampaignDigital(prev => (Object.keys(prev || {}).length ? prev : built));
    }
  }, [pipelineData, CampaignId]);

  if (!pipelineData) return <div>Loading Campaign Pipeline Data...</div>;




  const existingData = getExistingDataForSelectedNode();
// --- helpers to infer per-campaign digital status on the client ---
const toDate = (s) => (s ? new Date(s) : null);
const inRange = (d, start, end) => !!(d && start && end && d >= start && d <= end);

/**
 * Build { [spaceId]: DigitalStatus[] } scoped to THIS campaign
 * from the raw pipeline payload (no backend changes needed).
 */

function buildCampaignDigitalFromPipeline(pipeline, campaignId) {
  if (!pipeline?.spaces?.length) return {};

  const cid = String(campaignId);
  const out = {};

  for (const sp of pipeline.spaces) {
    const dsList = Array.isArray(sp.digitalStatus)
      ? sp.digitalStatus
        ? [sp.digitalStatus]
        : []
      : []; // Ensure dsList is always an array
console.log("dsList is",dsList);
    // 1) If campaignId exists on items, just filter (best case)
    let filtered = dsList.filter(d => d?.campaignId && String(d.campaignId) === cid);

    if (filtered.length === 0) {
      // 2) Heuristic by campaignDates window for this campaign
      const win = (sp.campaignDates || []).find(cd => String(cd.campaignId) === cid);
      const start = toDate(win?.startDate);
      const end = toDate(win?.endDate);

      if (start && end) {
        filtered = dsList.filter(d => {
          const gl = toDate(d?.goLiveDate);
          const upd = toDate(d?.updatedAt) || toDate(d?.createdAt);
          return inRange(gl, start, end) || inRange(upd, start, end);
        });
      }

      // 3) Fallback: if no campaignId, use the latest record per unit as "ours"
      if (filtered.length === 0 && sp.overlappingBooking === false && dsList.length) {
        const latestByUnit = new Map();
        for (const d of dsList) {
          const key = Number(d?.unitId);
          const t = toDate(d?.updatedAt) || toDate(d?.createdAt) || new Date(0);
          const prev = latestByUnit.get(key);
          if (!prev || t > prev._t) latestByUnit.set(key, { _t: t, item: d });
        }
        filtered = Array.from(latestByUnit.values()).map(v => v.item);
      }
    }

    out[sp._id] = filtered;
  }

  return out;
}

  return (
    <div className="w-full bg-white h-[100vh] relative">
      <button
        onClick={() => setShowDeleteModal(true)}
        className="absolute top-4 right-6 bg-red-600 text-white text-sm px-4 py-1 rounded shadow hover:bg-red-700 z-50"
      >
        Cleanup
      </button>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        zoomOnScroll={false}
        panOnScroll={false}
        fitView
      />

      {selectedNode && (
        <div style={modalStyle}>
          <div style={modalContentStyle} className="bg-white shadow-lg rounded-lg p-6 border">
            {/* MODIFICATION 2: PASS THE `existingData` PROP TO ALL FORM COMPONENTS */}
            {selectedNode.id === 'booking' && <BookingStatusForm existingData={pipelineData?.bookingStatus} campaignId={CampaignId} onClose={() => setSelectedNode(null)} onConfirm={() => { setSelectedNode(null); triggerRefresh(); }} />}
            {selectedNode.id === 'po' && <POForm existingData={existingData} campaignId={CampaignId} onClose={() => setSelectedNode(null)} onConfirm={() => { setSelectedNode(null); triggerRefresh(); }} />}
            {selectedNode.id === 'artwork' && <ArtworkForm existingData={pipelineData.artwork} campaignId={CampaignId} onClose={() => setSelectedNode(null)} onConfirm={() => { setSelectedNode(null); triggerRefresh(); }} />}
            {selectedNode.id === 'invoice' && <InvoiceForm existingData={pipelineData.invoice} campaignId={CampaignId} onClose={() => setSelectedNode(null)} onConfirm={() => { setSelectedNode(null); triggerRefresh(); }} />}
            {selectedNode.id === 'payment' && <PaymentStatusForm existingData={pipelineData.payment} campaignId={CampaignId} onClose={() => setSelectedNode(null)} onConfirm={() => { setSelectedNode(null); triggerRefresh(); }} />}
            {/* {selectedNode.id.startsWith('print-') && <PrintingStatus existingData={existingData} campaignId={CampaignId} spaceId={selectedNode.id.split('-')[1]} onClose={() => setSelectedNode(null)} onConfirm={() => { setSelectedNode(null); triggerRefresh(); }} />}
            {selectedNode.id.startsWith('mount-') && <MountingStatus existingData={existingData} campaignId={CampaignId} spaceId={selectedNode.id.split('-')[1]} onClose={() => setSelectedNode(null)} onConfirm={() => { setSelectedNode(null); triggerRefresh(); }} />}
             */}
{selectedNode.id.startsWith('print-') && <PrintingStatus existingData={existingData} campaignId={CampaignId} spaceId={selectedNode.id.split('-')[1]} unitId={parseInt(selectedNode.id.split('-')[2])} onClose={() => setSelectedNode(null)} onConfirm={() => { setSelectedNode(null); triggerRefresh(); }} />}
{selectedNode.id.startsWith('mount-') && <MountingStatus existingData={existingData} campaignId={CampaignId} spaceId={selectedNode.id.split('-')[1]} unitId={parseInt(selectedNode.id.split('-')[2])} onClose={() => setSelectedNode(null)} onConfirm={() => { setSelectedNode(null); triggerRefresh(); }} />}
{selectedNode.id.startsWith('digital-') && (
  <DigitalStatusForm
    existingData={campaignDigital|| []}  // 👈 campaign-scoped, passed as array
    spaceId={selectedNode.id.split('-')[1]}
    campaignId={CampaignId}
    unit={pipelineData.spaces.find(s => s._id === selectedNode.id.split('-')[1])?.unit}
    onClose={() => setSelectedNode(null)}
    onConfirm={() => { setSelectedNode(null); triggerRefresh(); }}
  />
)}

            {selectedNode.id.startsWith('live-') && (
              <IsLiveStatusView 
              campaignId={CampaignId}
              unitId={pipelineData.spaces.find(s => s._id === selectedNode.id.split('-')[1])?.unit}
              spaceId={selectedNode.id.split('-')[1]} onClose={() => setSelectedNode(null)} />
            )}
          </div>
        </div>
      )}

      {/* NEW: Placeholder modal for AddPrintingMountingStatus */}
      {/* {showAddPrintingMountingModal && selectedSpaceNode && (
        <div style={modalStyle}>
          <div style={modalContentStyle} className="bg-white shadow-lg rounded-lg p-6 border">
            <AddPrintingMountingStatusPlaceholder
              spaceId={selectedSpaceNode.id.split('-')[1]}
              spaceName={selectedSpaceNode.data.label}
              existingData={pipelineData.spaces.filter(s=>s._id===selectedSpaceNode.id.split('-')[1])}
              campaignId={CampaignId}
              onClose={() => {
                setShowAddPrintingMountingModal(false);
                setSelectedSpaceNode(null);
              }}
              onConfirm={() => {
                setShowAddPrintingMountingModal(false);
                setSelectedSpaceNode(null);
                triggerRefresh();
              }}
            />
          </div>
        </div>
      )} */}
{showAddPrintingMountingModal && selectedSpaceNode && (
        <div style={modalStyle}>
          <div style={modalContentStyle} className="bg-white shadow-lg rounded-lg p-6 border">
            <AddPrintingMountingStatusPlaceholder
              spaceId={selectedSpaceNode.id.split('-')[1]}
              spaceName={selectedSpaceNode.data.label}
              campaignId={CampaignId}
              existingData={pipelineData.spaces.filter(s => s._id === selectedSpaceNode.id.split('-')[1])} // Pass the specific space object in an array
              pipelineData={pipelineData} // Pass entire pipelineData for unitId calculation
              onClose={() => {
                setShowAddPrintingMountingModal(false);
                setSelectedSpaceNode(null);
              }}
              onConfirm={() => {
                setShowAddPrintingMountingModal(false);
                setSelectedSpaceNode(null);
                triggerRefresh();
              }}
            />
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div style={modalStyle}>
          <div style={{ ...modalContentStyle, width: '400px', height: '120px' }}>
            <h3 className="text-sm mx-auto font-semibold mb-4">Are you sure you want to delete this pipeline?</h3>
            <div className="flex justify-center gap-4">
              <button
                onClick={async () => {
                  try {
                    await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${CampaignId}`);
                    setPipelineData(null);
                    setShowDeleteModal(false);
                    window.location.reload();
                  } catch (err) {
                    console.error('Failed to delete pipeline:', err);
                    toast.error('Error deleting pipeline');
                  }
                }}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CampaignPipelineWrapper(props) {
  return (
    <ReactFlowProvider>
      <CampaignPipelineInternal {...props} />
    </ReactFlowProvider>
  );
}

const modalStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 1000,
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const modalContentStyle = {
  background: 'white',
  padding: '20px',
  borderRadius: '12px',
  display: 'inline-flex',
  flexDirection: 'column',
  maxHeight: '90vh',
  maxWidth: '90vw',
  overflowY: 'auto',
  boxSizing: 'border-box',
};