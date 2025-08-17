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


// --- 1. RECEIVE isFOC PROP ---
function CampaignPipelineInternal({ campaignId, isFOC }) {
  const { id } = useParams();
  const CampaignId = campaignId || id;
  const location = useLocation();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const { pipelineData, setPipelineData } = useContext(PipelineContext);
  const [spaces, setSpaces] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { fitView } = useReactFlow();
  const triggerRefresh = () => setRefreshKey(prev => prev + 1);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), []);
  const onNodeClick = (_, node) => {
    if (!node.id.startsWith('inventory-')) {
      setSelectedNode(node);
    }
  };

  const isNodeCompleted = (nodeId, space = null) => {
    if (nodeId === 'booking') return pipelineData?.bookingStatus?.confirmed;
    if (nodeId === 'po') return pipelineData?.po?.confirmed;
    if (nodeId === 'artwork') return pipelineData?.artwork?.confirmed;
    if (nodeId === 'invoice') {
      return Array.isArray(pipelineData?.invoice) && pipelineData.invoice.length > 0 && pipelineData.invoice.some(inv => inv.invoiceNumber);
    }
    if (nodeId === 'payment') return pipelineData?.payment?.payments?.length > 0;
    if (nodeId.startsWith('print-')) return space?.printingStatus?.confirmed;
    if (nodeId.startsWith('mount-')) return space?.mountingStatus?.confirmed;
    if (nodeId.startsWith('digital-')) return space?.digitalStatus?.confirmed;
    if (nodeId.startsWith('live-')) return space?.digitalStatus?.isLive;
    return false;
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
  }, [CampaignId, refreshKey]);

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/pipeline/campaign/${CampaignId}`);
        const populatedSpaces = res.data.spaces.map(s => s.id);
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

      // --- 2. CONDITIONALLY ADD INVOICE NODE ---
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

    // --- 3. CONDITIONALLY ADD PAYMENT NODE ---
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
      pipelineData.spaces.forEach((space, index) => {
        const inventoryId = `inventory-${space._id}`;
        const printId = `print-${space._id}`;
        const mountId = `mount-${space._id}`;
        const digitalId = `digital-${space._id}`;
        const liveId = `live-${space._id}`;

        dynamicNodes.push({
          id: inventoryId,
          data: { label: space.spaceName },
          position: { x: 650, y: 100 + index * 200 },
          style: getNodeStyle(true),
        });
    
        dynamicEdges.push({ id: `e-artwork-${space._id}`, source: 'artwork', target: inventoryId, markerEnd: 'arrowclosed' });
    
        if (space.spaceType === 'DOOH') {
          dynamicNodes.push(
            {
              id: digitalId,
              data: { label: <NodeLabel title="Digital Agency" timestamp={formatTimestamp(space.digitalStatus?.completedAt)} /> },
              position: { x: 850, y: 100 + index * 200 },
              style: getNodeStyle(isNodeCompleted(digitalId, space)),
            },
            {
              id: liveId,
              data: { label: <NodeLabel title="Is Live" timestamp={formatTimestamp(space.digitalStatus?.liveCompletedAt)} /> },
              position: { x: 1050, y: 100 + index * 200 },
              style: getNodeStyle(isNodeCompleted(liveId, space)),
            }
          );
          dynamicEdges.push({ id: `e-${space._id}-digital`, source: inventoryId, target: digitalId, markerEnd: 'arrowclosed' });
          if (space.digitalStatus?.confirmed) {
            dynamicEdges.push({ id: `e-digital-${space._id}-live`, source: digitalId, target: liveId, markerEnd: 'arrowclosed' });
          }
        } else {
          dynamicNodes.push(
            {
              id: printId,
              data: { label: <NodeLabel title="Printing Status" timestamp={formatTimestamp(space.printingStatus?.completedAt)} /> },
              position: { x: 850, y: 100 + index * 200 },
              style: getNodeStyle(isNodeCompleted(printId, space)),
            },
            {
              id: mountId,
              data: { label: <NodeLabel title="Mounting Status" timestamp={formatTimestamp(space.mountingStatus?.completedAt)} /> },
              position: { x: 1050, y: 100 + index * 200 },
              style: getNodeStyle(isNodeCompleted(mountId, space)),
            }
          );
          dynamicEdges.push({ id: `e-${space._id}-print`, source: inventoryId, target: printId, markerEnd: 'arrowclosed' });
          if (space.printingStatus?.confirmed) {
            dynamicEdges.push({ id: `e-print-${space._id}-mount`, source: printId, target: mountId, markerEnd: 'arrowclosed' });
          }
        }
      });
    }
    
    setNodes([...staticNodes, ...dynamicNodes]);
    setEdges([...staticEdges, ...dynamicEdges]);

    setTimeout(() => {
      fitView({ padding: 0.2, duration: 500 });
    }, 0);
  }, [pipelineData, spaces, isFOC, fitView]); // <-- 4. ADD isFOC TO DEPENDENCY ARRAY

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


  if (!pipelineData) return <div>Loading Campaign Pipeline Data...</div>;

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
            {selectedNode.id === 'booking' && <BookingStatusForm campaignId={CampaignId} onClose={() => setSelectedNode(null)} onConfirm={() => { setSelectedNode(null); triggerRefresh(); }} />}
            {selectedNode.id === 'po' && <POForm campaignId={CampaignId} onClose={() => setSelectedNode(null)} onConfirm={() => { setSelectedNode(null); triggerRefresh(); }} />}
            {selectedNode.id === 'artwork' && <ArtworkForm campaignId={CampaignId} onClose={() => setSelectedNode(null)} onConfirm={() => { setSelectedNode(null); triggerRefresh(); }} />}
            {selectedNode.id === 'invoice' && <InvoiceForm campaignId={CampaignId} onClose={() => setSelectedNode(null)} onConfirm={() => { setSelectedNode(null); triggerRefresh(); }} />}
            {selectedNode.id === 'payment' && <PaymentStatusForm campaignId={CampaignId} onClose={() => setSelectedNode(null)} onConfirm={() => { setSelectedNode(null); triggerRefresh(); }} />}
            {selectedNode.id.startsWith('print-') && <PrintingStatus campaignId={CampaignId} spaceId={selectedNode.id.split('-')[1]} onClose={() => setSelectedNode(null)} onConfirm={() => { setSelectedNode(null); triggerRefresh(); }} />}
            {selectedNode.id.startsWith('mount-') && <MountingStatus campaignId={CampaignId} spaceId={selectedNode.id.split('-')[1]} onClose={() => setSelectedNode(null)} onConfirm={() => { setSelectedNode(null); triggerRefresh(); }} />}
            {selectedNode.id.startsWith('digital-') && (
              <DigitalStatusForm
                campaignId={CampaignId}
                spaceId={selectedNode.id.split('-')[1]}
                onClose={() => setSelectedNode(null)}
                onConfirm={() => { setSelectedNode(null); triggerRefresh(); }}
              />
            )}
            {selectedNode.id.startsWith('live-') && (
              <IsLiveStatusView
                spaceId={selectedNode.id.split('-')[1]}
                onClose={() => setSelectedNode(null)}
              />
            )}
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

// --- 5. PASS ALL PROPS DOWN IN WRAPPER ---
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