// C:\Users\rajes\Desktop\New-Devangi-outdoor-optimization\my-project\src\components\CampaignPipeline.jsx
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
import { FaCheck, FaExclamationTriangle, FaTimes, FaStar } from 'react-icons/fa';

// Reusable UI components from CampaignDetails/SpaceDetails
const Card = ({ children, className = '', ...props }) => (
  <div
    className={`
      bg-gray-100 bg-opacity-80 shadow-xl rounded-2xl w-full flex flex-col relative overflow-hidden
      ${className}
    `}
    {...props}
  >
    <div className='absolute inset-0 bg-gradient-to-br from-white via-indigo-50 to-purple-50 opacity-20 animate-bg-gradient-flow-diagonal z-0'></div>
    <div className='relative z-10 h-full flex flex-col'>{children}</div>
  </div>
);

const CardContent = ({ children, className = '' }) => (
  <div className={`p-4 md:p-6 flex-grow flex flex-col ${className}`}>
    {children}
  </div>
);

const Button = ({ children, className = '', disabled = false, loading = false, ...props }) => (
  <button
    className={`px-4 py-2 rounded-xl bg-[black] text-white text-xs font-medium transition-all duration-200 transform hover:scale-105 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md hover:shadow-lg ${className}`}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? (
      <div className='flex items-center gap-2'>
        <div className='w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
        {children}
      </div>
    ) : (
      children
    )}
  </button>
);

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

  const currentSpace = pipelineData?.spaces?.find(s => s._id === spaceId);
  const maxUnitId = currentSpace?.printingStatus?.length > 0
    ? Math.max(...currentSpace.printingStatus.map(ps => ps.unitId)) + 1
    : 1;
    
  console.log("Calculated maxUnitId:", maxUnitId);

  const [printingDetails, setPrintingDetails] = useState({
    unitId: maxUnitId,
    confirmed: false,
    completedAt: "",
    assignedAgency: "",
    assignedPerson: "",
    isLive: false,
    liveCompletedAt: "",
    printingDate:"",
    goLiveDate: "",
    note: "",
  });

  const [mountingDetails, setMountingDetails] = useState({
    unitId: maxUnitId,
    confirmed: false,
    completedAt: "",
    assignedAgency: "",
    assignedPerson: "",
    isLive: false,
    liveCompletedAt: "",
    goLiveDate: "",
    mountingDate:"",
    note: "",
  });

  useEffect(() => {
    setPrintingDetails(prev => ({ ...prev, unitId: maxUnitId }));
    setMountingDetails(prev => ({ ...prev, unitId: maxUnitId }));
  }, [maxUnitId]);

  const handleAddPrintingMounting = async () => {
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
          printingStatus: finalPrintingDetails,
          mountingStatus: finalMountingDetails,
          campaignId: campaignId,
          spaceId: spaceId,
          unitId:maxUnitId
        }
      );

      if (response.status === 201) {
        toast.success('Printing and Mounting statuses added successfully!');
        onConfirm();
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
  const [edges, setEdges, onEdgesState] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
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
      setSelectedSpaceNode(node);
      setShowAddPrintingMountingModal(true);
    } else {
      setSelectedNode(node);
    }
  };

  const isNodeCompleted = (nodeId, space = null) => {
    if (nodeId === 'booking') return pipelineData?.bookingStatus?.confirmed;
    if (nodeId === 'po') return pipelineData?.po?.confirmed;
    if (nodeId === 'artwork') return pipelineData?.artwork?.confirmed;
    if (nodeId === 'invoice') {
      return Array.isArray(pipelineData?.invoice) &&
        pipelineData.invoice.length > 0 &&
        pipelineData.invoice.some(inv => inv.invoiceNumber);
    }
    if (nodeId === 'payment') return pipelineData?.payment?.payments?.length > 0;
    
    if (nodeId.startsWith('print-') || nodeId.startsWith('mount-')) {
      const parts = nodeId.split('-');
      const spaceId = parts[1];
      const unitId = parseInt(parts[2]);

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
    if (nodeId.startsWith('digital-')) {
      const spaceId = nodeId.split('-')[1];
      const targetSpace = pipelineData.spaces?.find(s => s._id === spaceId);
      if (!targetSpace) return false;
      const ds = campaignDigital?.[spaceId] ? campaignDigital[spaceId][0] : null;
      const currentCampaignId = String(pipelineData?.campaign?._id || '');
      return ds?.confirmed && String(ds.campaignId || '') === currentCampaignId;
    }
    if (nodeId.startsWith('live-')) {
      const spaceId = nodeId.split('-')[1];
      const targetSpace = pipelineData.spaces?.find(s => s._id === spaceId);
      if (!targetSpace) return false;
      const ds = campaignDigital?.[spaceId] ? campaignDigital[spaceId][0] : null;
      const currentCampaignId = String(pipelineData?.campaign?._id || '');
      return ds?.isLive && String(ds.campaignId || '') === currentCampaignId;
    }

    return false;
  };

  const getExistingDataForSelectedNode = () => {
    if (!selectedNode || !pipelineData) return null;

    const { id } = selectedNode;
    const parts = id.split('-');
    const spaceId = parts[1];
    const unitId = parts.length > 2 ? parseInt(parts[2]) : null;

    if (id === 'booking') return pipelineData.bookingStatus;
    if (id === 'po') return pipelineData.po;
    if (id === 'artwork') return pipelineData.artwork;
    if (id === 'invoice') return pipelineData.invoice;
    if (id === 'payment') return pipelineData.payment;

    const space = pipelineData.spaces.find(s => s._id === spaceId);
    if (!space) return null;

    if (id.startsWith('print-')) {
      return space.printingStatus?.find(ps => ps.unitId === unitId) || null;
    }
    if (id.startsWith('mount-')) {
      return space.mountingStatus?.find(ms => ms.unitId === unitId) || null;
    }

    if (id.startsWith('digital-')) {
      const digitalStatusesForSpace = campaignDigital[spaceId] || [];
      return digitalStatusesForSpace.find(ds => ds.unitId === unitId) || null;
    }
    if (id.startsWith('live-')) {
      const digitalStatusesForSpace = campaignDigital[spaceId] || [];
      return digitalStatusesForSpace.find(ds => ds.unitId === unitId) || null;
    }

    return null;
  };

  const getNodeStyle = (isComplete) => {
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
        setPipelineData(res.data);
      } catch (err) {
        if (err.response?.status === 404) {
          const createRes = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${CampaignId}`);
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
        const hasAny = payload && Object.values(payload).some(v => (Array.isArray(v) ? v.length : !!v));
        if (hasAny) {
          setCampaignDigital(payload);
        } else if (pipelineData?.spaces?.length) {
          setCampaignDigital(buildCampaignDigitalFromPipeline(pipelineData, CampaignId));
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
      fetchCampaignDigital();
    }
  }, [CampaignId, pipelineData?.spaces?.length, refreshKey]);
  
  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${CampaignId}`);
        const populatedSpaces = (res.data.spaces || []).map(s => s._id);
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
      pipelineData.spaces.forEach((space, spaceIndex) => {
        const inventoryId = `inventory-${space._id}`;
        const baseY = 100 + spaceIndex * 200;

        dynamicNodes.push({
          id: inventoryId,
          data: { label: space.spaceName },
          position: { x: 650, y: baseY },
          style: getNodeStyle(true),
        });

        dynamicEdges.push({ id: `e-artwork-${space._id}`, source: 'artwork', target: inventoryId, markerEnd: 'arrowclosed' });

        if (space.spaceType === 'DOOH') {
          const digitalId = `digital-${space._id}`;
          const liveId = `live-${space._id}`;
          const ds = campaignDigital?.[space._id] ? campaignDigital[space._id][0] : null;

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
              position: { x: 850, y: baseY },
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
              position: { x: 1050, y: baseY },
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

        } else {
          (space.printingStatus || []).forEach((printStatus, unitIndex) => {
            const unitId = printStatus.unitId;
            const printNodeId = `print-${space._id}-${unitId}`;
            const mountNodeId = `mount-${space._id}-${unitId}`;

            const mountStatus = (space.mountingStatus || []).find(ms => ms.unitId === unitId);
            const unitBranchY = baseY + (unitIndex * 150);

            dynamicNodes.push(
              {
                id: printNodeId,
                data: { label: <NodeLabel title={`Printing (Unit ${unitId})`} timestamp={formatTimestamp(printStatus.completedAt)} /> },
                position: { x: 850, y: unitBranchY },
                style: getNodeStyle(printStatus.confirmed),
              },
              {
                id: mountNodeId,
                data: { label: <NodeLabel title={`Mounting (Unit ${unitId})`} timestamp={formatTimestamp(mountStatus?.completedAt)} /> },
                position: { x: 1050, y: unitBranchY },
                style: getNodeStyle(mountStatus?.confirmed),
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
  }, [pipelineData, spaces, isFOC, fitView, setNodes, setEdges, campaignDigital]);

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

  if (!pipelineData) return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className='flex flex-col items-center gap-3 animate-pulse'>
        <div className='w-8 h-8 border-2 border-[black] border-t-transparent rounded-full animate-spin'></div>
        <div className='text-[var(--color-muted)] text-sm'>
          Loading campaign pipeline...
        </div>
      </div>
    </div>
  );

  const existingData = getExistingDataForSelectedNode();
  const toDate = (s) => (s ? new Date(s) : null);
  const inRange = (d, start, end) => !!(d && start && end && d >= start && d <= end);

  function buildCampaignDigitalFromPipeline(pipeline, campaignId) {
    if (!pipeline?.spaces?.length) return {};

    const cid = String(campaignId);
    const out = {};

    for (const sp of pipeline.spaces) {
      const dsList = Array.isArray(sp.digitalStatus)
        ? sp.digitalStatus
          ? [sp.digitalStatus]
          : []
        : [];
      console.log("dsList is", dsList);
      let filtered = dsList.filter(d => d?.campaignId && String(d.campaignId) === cid);

      if (filtered.length === 0) {
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
    <div className="w-full bg-white h-[100vh] relative p-6 border rounded-2xl shadow-xl">
      <div className="absolute top-6 right-6 z-50">
        <Button
          onClick={() => setShowDeleteModal(true)}
          className="bg-red-600 hover:bg-red-700"
        >
          Cleanup Pipeline
        </Button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesState}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        zoomOnScroll={false}
        panOnScroll={false}
        fitView
      />

      {selectedNode && (
        <div style={modalStyle}>
          <div style={modalContentStyle} className="bg-white shadow-lg rounded-lg p-6 border">
            {selectedNode.id === 'booking' && <BookingStatusForm existingData={existingData} campaignId={CampaignId} onClose={() => setSelectedNode(null)} onConfirm={() => { setSelectedNode(null); triggerRefresh(); }} />}
            {selectedNode.id === 'po' && <POForm existingData={existingData} campaignId={CampaignId} onClose={() => setSelectedNode(null)} onConfirm={() => { setSelectedNode(null); triggerRefresh(); }} />}
            {selectedNode.id === 'artwork' && <ArtworkForm existingData={existingData} campaignId={CampaignId} onClose={() => setSelectedNode(null)} onConfirm={() => { setSelectedNode(null); triggerRefresh(); }} />}
            {selectedNode.id === 'invoice' && <InvoiceForm existingData={existingData} campaignId={CampaignId} onClose={() => setSelectedNode(null)} onConfirm={() => { setSelectedNode(null); triggerRefresh(); }} />}
            {selectedNode.id === 'payment' && <PaymentStatusForm existingData={existingData} campaignId={CampaignId} onClose={() => setSelectedNode(null)} onConfirm={() => { setSelectedNode(null); triggerRefresh(); }} />}
            {selectedNode.id.startsWith('print-') && <PrintingStatus existingData={existingData} campaignId={CampaignId} spaceId={selectedNode.id.split('-')[1]} unitId={parseInt(selectedNode.id.split('-')[2])} onClose={() => setSelectedNode(null)} onConfirm={() => { setSelectedNode(null); triggerRefresh(); }} />}
            {selectedNode.id.startsWith('mount-') && <MountingStatus existingData={existingData} campaignId={CampaignId} spaceId={selectedNode.id.split('-')[1]} unitId={parseInt(selectedNode.id.split('-')[2])} onClose={() => setSelectedNode(null)} onConfirm={() => { setSelectedNode(null); triggerRefresh(); }} />}
            {selectedNode.id.startsWith('digital-') && (
              <DigitalStatusForm
                existingData={campaignDigital|| []}
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
                spaceId={selectedNode.id.split('-')[1]} 
                onClose={() => setSelectedNode(null)} 
              />
            )}
          </div>
        </div>
      )}

      {showAddPrintingMountingModal && selectedSpaceNode && (
        <div style={modalStyle}>
          <div style={modalContentStyle} className="bg-white shadow-lg rounded-lg p-6 border">
            <AddPrintingMountingStatusPlaceholder
              spaceId={selectedSpaceNode.id.split('-')[1]}
              spaceName={selectedSpaceNode.data.label}
              campaignId={CampaignId}
              existingData={pipelineData.spaces.filter(s => s._id === selectedSpaceNode.id.split('-')[1])}
              pipelineData={pipelineData}
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

function CampaignPipelineWrapper(props) {
  return (
    <ReactFlowProvider>
      <CampaignPipelineInternal {...props} />
    </ReactFlowProvider>
  );
}

export default CampaignPipelineWrapper;