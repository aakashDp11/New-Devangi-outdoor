import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useSidebar } from '../context/SidebarContext';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DateRange } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { FaArrowLeft, FaArrowRight, FaTimes, FaCheck, FaExclamationTriangle } from 'react-icons/fa';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41],
    popupAnchor: [1, -34], tooltipAnchor: [16, -28], shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- REUSABLE COMPONENTS WITH BORDERLESS DESIGN ---

// Card component with a flowing gradient animation on the background
const Card = ({ children, className = '', ...props }) => (
    <div className={`
        bg-gray-100 bg-opacity-80 shadow-xl rounded-2xl w-full flex flex-col relative overflow-hidden
        ${className}
    `} {...props}>
        <div className="absolute inset-0 bg-gradient-to-br from-white via-indigo-50 to-purple-50 opacity-20 animate-bg-gradient-flow-diagonal z-0"></div>
        <div className="relative z-10 h-full flex flex-col">
            {children}
        </div>
    </div>
);

// New CardContent
const CardContent = ({ children, className = '' }) => (
    <div className={`p-4 md:p-6 flex-grow flex flex-col ${className}`}>{children}</div>
);

// --- VALIDATION HELPERS ---
const ValidationMessage = ({ message, type = 'error' }) => {
    if (!message) return null;
    return (
        <div className={`flex items-center gap-2 mt-1 text-xs animate-slideDown ${
            type === 'error' ? 'text-red-500' : 'text-green-500'
        }`}>
            {type === 'error' ? <FaExclamationTriangle /> : <FaCheck />}
            {message}
        </div>
    );
};

const validateSearch = (value) => {
    if (value && value.length < 2) return "Search must be at least 2 characters";
    if (value && value.length > 100) return "Search is too long";
    return null;
};

const validateFile = (file) => {
    if (!file) return "Please select a file";
    const validTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'];
    if (!validTypes.includes(file.type)) return "Only Excel (.xlsx) and CSV files are allowed";
    if (file.size > 10 * 1024 * 1024) return "File size must be less than 10MB";
    return null;
};

// --- UI HELPER COMPONENTS ---
const Button = ({ children, className = '', disabled = false, loading = false, ...props }) => (
    <button
        className={`px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-medium transition-all duration-200 transform hover:scale-105 hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md hover:shadow-lg ${className}`}
        disabled={disabled || loading}
        {...props}
    >
        {loading ? (
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {children}
            </div>
        ) : children}
    </button>
);

const Pagination = ({ currentPage, totalPages, onPageChange, totalCount, itemsPerPage }) => {
    const [pageInput, setPageInput] = useState(currentPage.toString());
    const [validationError, setValidationError] = useState('');

    useEffect(() => {
        setPageInput(currentPage.toString());
        setValidationError('');
    }, [currentPage]);

    const validatePageInput = (value) => {
        const pageNum = parseInt(value, 10);
        if (!value) return "Page number required";
        if (isNaN(pageNum)) return "Must be a number";
        if (pageNum < 1) return "Must be at least 1";
        if (pageNum > totalPages) return `Must be at most ${totalPages}`;
        return null;
    };

    const handlePageSubmit = (e) => {
        e.preventDefault();
        const error = validatePageInput(pageInput);
        if (error) {
            setValidationError(error);
            return;
        }
        const pageNum = parseInt(pageInput, 10);
        onPageChange(pageNum);
        setValidationError('');
    };

    const handleInputChange = (e) => {
        setPageInput(e.target.value);
        const error = validatePageInput(e.target.value);
        setValidationError(error);
    };

    if (totalCount === 0) {
        return (
            <div className="text-center py-20 animate-fadeIn">
                <div className="text-[var(--color-muted)] text-lg mb-2">📦</div>
                <div className="text-[var(--color-muted)]">No inventories found</div>
            </div>
        );
    }

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalCount);

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 text-xs gap-4 animate-slideUp">
            <span className="text-[var(--color-muted)] transition-all duration-200 hover:text-[var(--color-text)]">
                Showing {startItem} - {endItem} of {totalCount} results
            </span>
            {totalPages > 1 && (
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => onPageChange(currentPage > 1 ? currentPage - 1 : 1)}
                        className="p-3 rounded-full bg-white shadow-sm hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200"
                        disabled={currentPage === 1}
                    >
                        <FaArrowLeft className='inline' />
                    </button>
                    <div className="flex flex-col items-center">
                        <form onSubmit={handlePageSubmit} className="flex items-center gap-2">
                            <span className="text-[var(--color-text)]">Page</span>
                            <input
                                type="text"
                                value={pageInput}
                                onChange={handleInputChange}
                                className={`w-12 h-8 text-center rounded-lg bg-white text-[var(--color-text)] focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md ${
                                    validationError ? 'ring-red-300' : 'ring-[var(--color-primary)]'
                                }`}
                            />
                            <span className="text-[var(--color-text)]">of {totalPages}</span>
                        </form>
                        <ValidationMessage message={validationError} />
                    </div>
                    <button
                        onClick={() => onPageChange(currentPage < totalPages ? currentPage + 1 : totalPages)}
                        className="p-3 rounded-full bg-white shadow-sm hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 transition-all duration-200"
                        disabled={currentPage === totalPages}
                    >
                        <FaArrowRight className='inline' />
                    </button>
                </div>
            )}
        </div>
    );
};

const AvailabilityBadge = ({ availabilityStatus }) => {
    let colorClasses, text;
    switch (availabilityStatus) {
        case 'Completely booked':
        case 'Booked':
            colorClasses = 'bg-red-200 text-red-800';
            text = 'Booked';
            break;
        case 'Partially available':
        case 'Partialy available':
            colorClasses = 'bg-yellow-200 text-yellow-800';
            text = 'Partially Available';
            break;
        case 'Overlapping booking':
            colorClasses = 'bg-orange-200 text-orange-800';
            text = 'Overlapping';
            break;
        default:
            colorClasses = 'bg-green-200 text-green-800';
            text = 'Available';
            break;
    }
    return (
        <span className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all duration-200 hover:scale-105 ${colorClasses}`}>
            {text}
        </span>
    );
};

const SortableHeader = ({ title, sortKey, sortConfig, setSortConfig }) => {
    const isSorting = sortConfig.key === sortKey;
    const direction = isSorting ? sortConfig.direction : null;
    const handleSort = () => setSortConfig(prev => ({
        key: sortKey,
        direction: prev.key === sortKey && prev.direction === 'asc' ? 'desc' : 'asc'
    }));

    return (
        <th scope="col" className="px-6 py-3">
            <div
                onClick={handleSort}
                className="flex items-center gap-1.5 cursor-pointer select-none text-[var(--color-text)] hover:text-[var(--color-primary)] transition-all duration-200 hover:scale-105 active:scale-95"
            >
                {title}
                <span className={`text-[var(--color-muted)] transition-all duration-200 ${isSorting ? 'text-[var(--color-primary)] scale-110' : ''}`}>
                    {direction === 'asc' ? '▲' : direction === 'desc' ? '▼' : '⇅'}
                </span>
            </div>
        </th>
    );
};

// Image Preview Modal Component
const ImagePreviewModal = ({ imageUrl, onClose }) => {
    if (!imageUrl) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] animate-fadeIn" onClick={onClose}>
            <div className="relative p-4 rounded-lg shadow-lg max-w-screen-lg max-h-screen-lg animate-scaleIn" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-white text-2xl bg-[var(--color-surface)] hover:bg-[var(--color-hover)] rounded-full p-1 cursor-pointer transition-all duration-200 hover:scale-110 hover:rotate-90"
                >
                    <FaTimes />
                </button>
                <img
                    src={imageUrl}
                    alt="Preview"
                    className="max-w-full max-h-[90vh] object-contain rounded-lg animate-slideUp"
                    onLoad={(e) => e.target.classList.add('animate-fadeIn')}
                />
            </div>
        </div>
    );
};

// --- VIEW COMPONENTS ---
const InventoryGridView = ({ data, onTagUpdate, navigate, onImageClick }) => {
    const [tagInputErrors, setTagInputErrors] = useState({});

    const validateTag = (tag) => {
        if (!tag.trim()) return "Tag cannot be empty";
        if (tag.length < 2) return "Tag must be at least 2 characters";
        if (tag.length > 20) return "Tag must be less than 20 characters";
        if (!/^[a-zA-Z0-9\s-_]+$/.test(tag)) return "Tag can only contain letters, numbers, spaces, hyphens and underscores";
        return null;
    };

    const handleTagInput = (spaceId, tag, inputElement) => {
        const error = validateTag(tag);
        if (error) {
            setTagInputErrors(prev => ({ ...prev, [spaceId]: error }));
            return;
        }
        setTagInputErrors(prev => ({ ...prev, [spaceId]: null }));
        onTagUpdate('add', spaceId, tag);
        inputElement.value = '';
    };

    if (!data || data.length === 0) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 text-xs gap-5">
            {data.map((item, index) => {
                const tags = Array.isArray(item.tags) ? item.tags : String(item.tags || '').split(',').filter(tag => tag.trim() !== '');
                return (
                    <div
                        key={item._id}
                        className="bg-gray-100 shadow-lg rounded-xl text-xs hover:shadow-xl cursor-pointer transition-all duration-300 flex flex-col hover:scale-105 hover:-translate-y-1 animate-slideUp"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <div className="relative overflow-hidden rounded-t-xl">
                            <img
                                src={item.mainPhoto || 'https://via.placeholder.com/300x200'}
                                alt="Space"
                                className="w-full h-40 object-cover bg-gray-100 cursor-pointer transition-all duration-300 hover:scale-110"
                                onClick={(e) => { e.stopPropagation(); onImageClick(item.mainPhoto || 'https://via.placeholder.com/300x200'); }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
                        </div>
                        <div className="p-4 flex flex-col flex-grow">
                            <div className="flex-grow" onClick={() => navigate(`/space/${item._id}`)}>
                                <div className="flex justify-between items-start gap-2">
                                    <h3 className="font-semibold text-[var(--color-text)] leading-tight hover:text-[var(--color-primary)] transition-colors duration-200">
                                        {item.spaceName}
                                    </h3>
                                    <div className="flex-shrink-0"><AvailabilityBadge availabilityStatus={item.availability} /></div>
                                </div>
                                <p className="text-sm text-[var(--color-muted)] mt-1 mb-3">{item.address || 'No address'}</p>
                                <div className="flex gap-2 text-xs flex-wrap mb-2">
                                    <span className="text-xs px-2 py-1 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary-text)] transition-all duration-200 hover:scale-105">
                                        {item.city || 'N/A'}
                                    </span>
                                    <span className="text-xs px-2 py-1 rounded-full bg-[var(--color-secondary-light)] text-[var(--color-secondary-text)] transition-all duration-200 hover:scale-105">
                                        {item.spaceType || 'N/A'}
                                    </span>
                                </div>
                                <div className="flex gap-1.5 flex-wrap">
                                    {tags.map((tag, idx) => (
                                        <div
                                            key={idx}
                                            className="relative group text-xs px-2 py-1 rounded-full bg-gray-100 text-[var(--color-text)] flex items-center transition-all duration-200 hover:bg-gray-200 hover:scale-105 animate-slideIn"
                                            style={{ animationDelay: `${idx * 100}ms` }}
                                        >
                                            {tag}
                                            <span
                                                onClick={(e) => { e.stopPropagation(); onTagUpdate('remove', item._id, tag); }}
                                                className="ml-1.5 text-red-500 hidden group-hover:inline cursor-pointer font-bold hover:scale-125 transition-all duration-200"
                                            >
                                                ×
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-4 text-xs">
                                <input
                                    placeholder="+ Add Tag"
                                    className={`px-2 py-1 w-full rounded-lg bg-gray-50 text-[var(--color-text)] focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md ${
                                        tagInputErrors[item._id] ? 'ring-red-300' : 'ring-[var(--color-primary)]'
                                    }`}
                                    onKeyDown={(e) => {
                                        e.stopPropagation();
                                        if (e.key === 'Enter' && e.target.value.trim()) {
                                            handleTagInput(item._id, e.target.value.trim(), e.target);
                                        }
                                    }}
                                    onChange={(e) => {
                                        const error = validateTag(e.target.value);
                                        setTagInputErrors(prev => ({ ...prev, [item._id]: error }));
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <ValidationMessage message={tagInputErrors[item._id]} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const InventoryTableView = ({ data, currentPage, limit, navigate, sortConfig, setSortConfig, onImageClick }) => {
    if (!data || data.length === 0) return null;

    return (
        <Card className="shadow-lg rounded-xl animate-slideUp bg-gray-100 bg-opacity-90">
            <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-[var(--color-muted)]">
                    <thead className="text-xs text-[var(--color-text)] uppercase bg-gray-100">
                        <tr>
                            <th scope="col" className="px-6 py-3 rounded-tl-xl">#</th>
                            <SortableHeader title="Space Name" sortKey="spaceName" sortConfig={sortConfig} setSortConfig={setSortConfig} />
                            <SortableHeader title="City" sortKey="city" sortConfig={sortConfig} setSortConfig={setSortConfig} />
                            <SortableHeader title="Category" sortKey="spaceType" sortConfig={sortConfig} setSortConfig={setSortConfig} />
                            <SortableHeader title="Availability" sortKey="availability" sortConfig={sortConfig} setSortConfig={setSortConfig} />
                            <SortableHeader title="Ownership" sortKey="ownershipType" sortConfig={sortConfig} setSortConfig={setSortConfig} />
                            <SortableHeader title="Inventory ID" sortKey="inventoryId" sortConfig={sortConfig} setSortConfig={setSortConfig} />
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, index) => (
                            <tr
                                key={item._id}
                                className="bg-white hover:bg-gray-50 transition-all duration-200 animate-slideIn border-b border-gray-200"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <td className="px-6 py-4 text-[var(--color-muted)] cursor-pointer transition-all duration-200 hover:text-[var(--color-primary)]"
                                    onClick={() => navigate(`/space/${item._id}`)}>
                                    {(currentPage - 1) * limit + index + 1}
                                </td>
                                <td className="px-6 py-4 font-medium text-[var(--color-text)] whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="relative overflow-hidden rounded-md shadow">
                                            <img
                                                src={item.mainPhoto || 'https://via.placeholder.com/40'}
                                                alt={item.spaceName}
                                                className="w-10 h-10 object-cover bg-gray-100 cursor-pointer hover:opacity-80 transition-all duration-200 hover:scale-110"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onImageClick(item.mainPhoto || 'https://via.placeholder.com/40');
                                                }}
                                            />
                                        </div>
                                        <div className="cursor-pointer transition-all duration-200 hover:translate-x-1" onClick={() => navigate(`/space/${item._id}`)}>
                                            <div className="font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors duration-200">
                                                {item.spaceName}
                                            </div>
                                            <div className="text-[var(--color-muted)] text-xs">{item.address}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 cursor-pointer text-[var(--color-text)] hover:text-[var(--color-primary)] transition-all duration-200"
                                    onClick={() => navigate(`/space/${item._id}`)}>{item.city}</td>
                                <td className="px-6 py-4 cursor-pointer text-[var(--color-text)] hover:text-[var(--color-primary)] transition-all duration-200"
                                    onClick={() => navigate(`/space/${item._id}`)}>{item.spaceType}</td>
                                <td className="px-6 py-4 cursor-pointer transition-all duration-200"
                                    onClick={() => navigate(`/space/${item._id}`)}>
                                    <AvailabilityBadge availabilityStatus={item.availability} />
                                </td>
                                <td className="px-6 py-4 cursor-pointer text-[var(--color-text)] hover:text-[var(--color-primary)] transition-all duration-200"
                                    onClick={() => navigate(`/space/${item._id}`)}>{item.ownershipType}</td>
                                <td className="px-6 py-4 font-mono text-xs text-[var(--color-muted)] cursor-pointer hover:text-[var(--color-primary)] transition-all duration-200"
                                    onClick={() => navigate(`/space/${item._id}`)}>
                                    {item.inventoryId || item._id.slice(-8).toUpperCase()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

const InventoryMapView = ({ spaces, navigate }) => {
    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const [mapLoading, setMapLoading] = useState(true);

    useEffect(() => {
        if (mapContainerRef.current && !mapInstanceRef.current) {
            const map = L.map(mapContainerRef.current, { center: [20.5937, 78.9629], zoom: 5 });
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);
            mapInstanceRef.current = map;

            // Add loading indicator
            setTimeout(() => setMapLoading(false), 1000);
        }

        const map = mapInstanceRef.current;
        if (map && !mapLoading) {
            // Clear existing markers
            map.eachLayer(layer => { if (layer instanceof L.Marker) map.removeLayer(layer); });

            const markerBounds = [];
            if (Array.isArray(spaces)) {
                spaces.forEach((space, index) => {
                    const lat = parseFloat(space.latitude);
                    const lng = parseFloat(space.longitude);
                    if (!isNaN(lat) && !isNaN(lng)) {
                        const tooltipContent = `<strong>${space.spaceName}</strong><br/>Lat: ${lat}, Lng: ${lng}`;

                        // Add marker with delay for animation effect
                        setTimeout(() => {
                            const marker = L.marker([lat, lng])
                                .addTo(map)
                                .bindTooltip(tooltipContent)
                                .on('click', () => navigate(`/space/${space._id}`));
                        }, index * 100);

                        markerBounds.push([lat, lng]);
                    }
                });
            }

            if (markerBounds.length > 0) {
                setTimeout(() => {
                    map.fitBounds(markerBounds, { padding: [50, 50] });
                }, spaces.length * 100 + 500);
            }
        }
    }, [spaces, navigate, mapLoading]);

    return (
        <Card className="relative h-[65vh] shadow-xl animate-slideUp bg-gray-100 bg-opacity-90">
            <CardContent>
                {mapLoading && (
                    <div className="absolute inset-0 bg-white rounded-lg flex items-center justify-center z-10">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
                            <div className="text-[var(--color-muted)] text-sm">Loading map...</div>
                        </div>
                    </div>
                )}
                <div
                    ref={mapContainerRef}
                    className="w-full h-full rounded-lg transition-all duration-300"
                />
            </CardContent>
        </Card>
    );
};

// --- MAIN DASHBOARD COMPONENT ---
export default function InventoryDashboard() {
    const navigate = useNavigate();
    const { isCollapsed } = useSidebar();
    const datePickerRef = useRef(null);
    const [spaces, setSpaces] = useState([]);
    const [mapSpaces, setMapSpaces] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [viewMode, setViewMode] = useState('table');
    const [loading, setLoading] = useState(false);
    const limit = 10;

    const [search, setSearch] = useState('');
    const [selectedRegion, setSelectedRegion] = useState('');
    const [availability, setAvailability] = useState('');
    const [spaceType, setSpaceType] = useState('');
    const [ownershipType, setOwnershipType] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [showDateModal, setShowDateModal] = useState(false);
    const [dateRange, setDateRange] = useState([{ startDate: null, endDate: null, key: 'selection' }]);
    const [tempDateRange, setTempDateRange] = useState([{ startDate: null, endDate: null, key: 'selection' }]);
    const [sortConfig, setSortConfig] = useState({ key: '', direction: 'asc' });
    const [previewImageUrl, setPreviewImageUrl] = useState(null);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);

    // Validation states
    const [searchError, setSearchError] = useState('');
    const [fileError, setFileError] = useState('');

    // Notification system
    const addNotification = (message, type = 'success') => {
        const id = Date.now();
        const notification = { id, message, type };
        setNotifications(prev => [...prev, notification]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    };

    // Fetch paginated data for table and grid
    const fetchSpaces = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const params = new URLSearchParams({
                page: currentPage,
                limit,
                search,
                region: selectedRegion,
                availability,
                spaceType,
                ownershipType,
                ...(startDate && endDate && { startDate, endDate }),
            });

            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/listInventory?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.status === 403) {
                localStorage.clear();
                navigate('/login');
                return;
            }

            const data = await res.json();
            setSpaces(data.spaces);
            setTotalCount(data.totalCount);
        } catch (error) {
            addNotification("Failed to fetch inventories", 'error');
        } finally {
            setLoading(false);
        }
    }, [currentPage, search, selectedRegion, availability, startDate, endDate, spaceType, ownershipType, navigate]);

    // Fetch all location data for the map view
    const fetchMapLocations = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const params = new URLSearchParams({
                search,
                region: selectedRegion,
                availability,
                spaceType,
                ownershipType,
                ...(startDate && endDate && { startDate, endDate }),
            });

            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/map-locations?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.status === 403) {
                localStorage.clear();
                navigate('/login');
                return;
            }

            const data = await res.json();
            setMapSpaces(data);
            setTotalCount(data.length);
        } catch (error) {
            addNotification("Failed to fetch map locations", 'error');
        } finally {
            setLoading(false);
        }
    }, [search, selectedRegion, availability, startDate, endDate, spaceType, ownershipType, navigate]);

    useEffect(() => {
        if (viewMode === 'map') {
            fetchMapLocations();
        } else {
            fetchSpaces();
        }
    }, [viewMode, fetchSpaces, fetchMapLocations, startDate, endDate]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
                setShowDateModal(false);
            }
        }
        if (showDateModal) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showDateModal]);

    const sortedSpaces = useMemo(() => {
        let sortableItems = [...spaces];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                const aVal = a[sortConfig.key]?.toString().toLowerCase() || "";
                const bVal = b[sortConfig.key]?.toString().toLowerCase() || "";
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [spaces, sortConfig]);

    const handleSearchChange = (value) => {
        setSearch(value);
        const error = validateSearch(value);
        setSearchError(error);
        if (!error) {
            setCurrentPage(1);
        }
    };

    const handleTagUpdate = async (action, spaceId, tag) => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/${spaceId}/${action}-tag`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ tag })
            });

            if (res.ok) {
                addNotification(`Tag ${action === 'add' ? 'added' : 'removed'} successfully`);
                fetchSpaces();
            } else {
                addNotification(`Failed to ${action} tag`, 'error');
            }
        } catch (err) {
            addNotification(`Error while trying to ${action} tag`, 'error');
        }
    };

    const handleDownloadExcel = () => {
        if (spaces.length === 0) {
            addNotification("No data to download", 'error');
            return;
        }

        try {
            const excelData = spaces.map(item => ({
                'Space Name': item.spaceName,
                'Address': item.address,
                'City': item.city,
                'State': item.state,
                'Zone': item.zone,
                'Space Type': item.spaceType,
                'Availability': item.availability,
                'Units': item.unit,
                'Price': item.price,
                'Inventory ID': item.inventoryId || item._id,
                'Tags': (Array.isArray(item.tags) ? item.tags : String(item.tags || '').split(',')).join(', ')
            }));

            const worksheet = XLSX.utils.json_to_sheet(excelData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventories');
            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            const dataBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
            saveAs(dataBlob, `inventories-${new Date().toISOString().split('T')[0]}.xlsx`);

            addNotification("Excel file downloaded successfully");
        } catch (error) {
            addNotification("Failed to download Excel file", 'error');
        }
    };

    const handleFileSelect = (file) => {
        setSelectedFile(file);
        const error = validateFile(file);
        setFileError(error);
        if (!error) {
            setShowUploadModal(true);
        }
    };

    const handleConfirmUpload = async () => {
        if (!selectedFile || fileError) return;

        setUploadLoading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const token = localStorage.getItem('accessToken');
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spaces/upload-excel`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                addNotification(`Successfully uploaded ${result.count} inventories`);
                setShowUploadModal(false);
                setSelectedFile(null);
                setFileError('');
                fetchSpaces();
            } else {
                addNotification(result.error || 'Upload failed', 'error');
            }
        } catch (error) {
            addNotification('Something went wrong while uploading', 'error');
        } finally {
            setUploadLoading(false);
        }
    };

    const resetFilters = () => {
        setSearch('');
        setSelectedRegion('');
        setAvailability('');
        setStartDate('');
        setEndDate('');
        setCurrentPage(1);
        setSpaceType('');
        setOwnershipType('');
        setSortConfig({ key: '', direction: 'asc' });
        setSearchError('');

        const initialRange = [{ startDate: null, endDate: null, key: 'selection' }];
        setDateRange(initialRange);
        setTempDateRange(initialRange);

        addNotification("Filters reset successfully");
    };

    const formatDate = (date) => date ? new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0] : '';

    const handleApplyDateFilter = () => {
        const { startDate: start, endDate: end } = tempDateRange[0];

        if (start && end && start > end) {
            addNotification("Start date cannot be after end date", 'error');
            return;
        }

        setDateRange(tempDateRange);
        setStartDate(formatDate(start));
        setEndDate(formatDate(end));
        setShowDateModal(false);
        setCurrentPage(1);

        if (start && end) {
            addNotification("Date filter applied successfully");
        }
    };

    const handleCancelDateFilter = () => {
        setShowDateModal(false);
        setTempDateRange(dateRange);
    };

    const totalPages = Math.ceil(totalCount / limit);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 w-screen text-[var(--color-text)] flex flex-col lg:flex-row">
            <Navbar />

            {/* Notification System */}
            <div className="fixed top-4 right-4 z-50 space-y-2">
                {notifications.map((notification) => (
                    <div
                        key={notification.id}
                        className={`px-4 py-3 rounded-lg shadow-lg ${
                            notification.type === 'error'
                                ? 'bg-red-50 text-red-800'
                                : 'bg-green-50 text-green-800'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            {notification.type === 'error' ? <FaExclamationTriangle /> : <FaCheck />}
                            <span className="text-sm font-medium">{notification.message}</span>
                        </div>
                    </div>
                ))}
            </div>

            <main className={`flex-1 h-screen overflow-y-auto px-4 md:px-6 py-8 transition-all duration-300 ${isCollapsed ? 'lg:ml-24' : 'lg:ml-64'}`}>
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 animate-slideDown">
                    <h2 className="text-2xl font-sans font-normal">
                        Inventories ({totalCount})
                        {loading && <span className="ml-2 text-sm text-[var(--color-muted)]">Loading...</span>}
                    </h2>
                    <div className="flex items-center gap-2 text-xs">
                        <Button onClick={() => navigate('/add-space')}>+ Add Space</Button>
                        <input
                            type="file"
                            accept=".xlsx, .csv"
                            id="excel-upload"
                            onChange={(e) => {
                                if (e.target.files[0]) {
                                    handleFileSelect(e.target.files[0]);
                                }
                            }}
                            className="hidden"
                        />
                        <label
                            htmlFor="excel-upload"
                            className="cursor-pointer px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white text-xs font-medium hover:opacity-90 transition-all duration-200 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
                        >
                            Upload Excel
                        </label>
                        <Button onClick={handleDownloadExcel}>Download Excel</Button>
                    </div>
                </div>

                <Card className="mt-6 shadow-xl animate-slideUp bg-gray-100 bg-opacity-80">
                    <CardContent>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="w-full md:w-[50%]">
                                <input
                                    type="text"
                                    placeholder="Search by name, address, city, tags..."
                                    value={search}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className={`w-full px-4 py-2 text-xs rounded-xl bg-white text-[var(--color-text)] focus:outline-none focus:ring-2 transition-all duration-200 shadow-sm hover:shadow-md ${
                                        searchError ? 'ring-red-300' : 'ring-[var(--color-primary)]'
                                    }`}
                                />
                                <ValidationMessage message={searchError} />
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <div className="flex items-center p-1 bg-gray-100 rounded-xl shadow-inner">
                                    {[
                                        { mode: 'table', icon: <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="3" x2="9" y2="21" /></svg> },
                                        { mode: 'grid', icon: <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg> },
                                        { mode: 'map', icon: <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> }
                                    ].map(v => (
                                        <button
                                            key={v.mode}
                                            onClick={() => setViewMode(v.mode)}
                                            className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-105 ${
                                                viewMode === v.mode
                                                    ? 'bg-white shadow-md text-[var(--color-text)] scale-110'
                                                    : 'text-[var(--color-muted)] hover:bg-gray-200'
                                            }`}
                                        >
                                            {v.icon}
                                        </button>
                                    ))}
                                </div>
                                <Button onClick={resetFilters} className="bg-gray-700 text-white hover:bg-gray-800 shadow-md hover:shadow-lg">
                                    Reset Filters
                                </Button>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3 text-xs items-center animate-slideUp" style={{ animationDelay: '200ms' }}>
                            <input
                                className="px-3 py-2 rounded-xl w-full md:w-auto bg-white text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all duration-200 shadow-sm hover:shadow-md"
                                value={selectedRegion}
                                onChange={(e) => { setSelectedRegion(e.target.value); setCurrentPage(1); }}
                                placeholder="City/State/Zone"
                            />
                            <select
                                className="px-3 py-2 rounded-xl w-full md:w-auto bg-white text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all duration-200 shadow-sm hover:shadow-md"
                                value={spaceType}
                                onChange={(e) => { setSpaceType(e.target.value); setCurrentPage(1); }}
                            >
                                <option value="">All Space Types</option>
                                <option value="Billboard">Billboard</option>
                                <option value="DOOH">DOOH</option>
                                <option value="Pole Kiosk">Pole Kiosk</option>
                                <option value="Gantry">Gantry</option>
                                <option value="BQS">BQS</option>
                                <option value="Transit">Transit</option>
                                <option value="Miscellaneous">Miscellaneous</option>
                            </select>
                            <select
                                className="px-3 py-2 rounded-xl w-full md:w-auto bg-white text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all duration-200 shadow-sm hover:shadow-md"
                                value={ownershipType}
                                onChange={(e) => { setOwnershipType(e.target.value); setCurrentPage(1); }}
                            >
                                <option value="">All Ownerships</option>
                                <option value="Owned">Owned</option>
                                <option value="Leased">Leased</option>
                                <option value="Traded">Traded</option>
                            </select>
                            <select
                                className="px-3 py-2 rounded-xl w-full md:w-auto bg-white text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all duration-200 shadow-sm hover:shadow-md"
                                value={availability}
                                onChange={(e) => { setAvailability(e.target.value); setCurrentPage(1); }}
                            >
                                <option value="">All Availabilities</option>
                                <option value="Completely available">Completely Available</option>
                                <option value="Partially available">Partially Available</option>
                                <option value="Completely booked">Completely Booked</option>
                                <option value="Overlapping booking">Overlapping Booking</option>
                            </select>
                            <div ref={datePickerRef} className="relative w-full md:w-auto">
                                <button
                                    onClick={() => { setTempDateRange(dateRange); setShowDateModal(prev => !prev); }}
                                    className="px-4 py-2 rounded-xl hover:bg-gray-100 hover:ring-2 ring-[var(--color-primary)] w-full text-left bg-white text-[var(--color-text)] transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
                                >
                                    {dateRange[0].startDate && dateRange[0].endDate ? `${formatDate(dateRange[0].startDate)} to ${formatDate(dateRange[0].endDate)}` : "Date Filter"}
                                </button>
                                {showDateModal && (
                                    <div className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-lg p-2 z-50 text-xs animate-scaleIn" onClick={(e) => e.stopPropagation()}>
                                        <DateRange
                                            editableDateInputs={true}
                                            onChange={item => setTempDateRange([item.selection])}
                                            moveRangeOnFirstSelection={false}
                                            ranges={tempDateRange}
                                            rangeColors={['#000000']}
                                            months={1}
                                            direction="horizontal"
                                        />
                                        <div className="flex justify-end gap-2 p-2 pt-0">
                                            <button
                                                onClick={handleCancelDateFilter}
                                                className="px-4 py-1.5 rounded-md bg-gray-100 text-[var(--color-text)] hover:bg-gray-200 transition-all duration-200 hover:scale-105"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleApplyDateFilter}
                                                className="px-4 py-1.5 rounded-md bg-[var(--color-primary)] text-white hover:opacity-90 transition-all duration-200 hover:scale-105"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="mt-6 relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center z-10">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
                                <div className="text-[var(--color-muted)] text-sm">Loading inventories...</div>
                            </div>
                        </div>
                    )}

                    {viewMode === 'table' && <InventoryTableView data={sortedSpaces} currentPage={currentPage} limit={limit} navigate={navigate} sortConfig={sortConfig} setSortConfig={setSortConfig} onImageClick={setPreviewImageUrl} />}
                    {viewMode === 'grid' && <InventoryGridView data={spaces} onTagUpdate={handleTagUpdate} navigate={navigate} onImageClick={setPreviewImageUrl} />}
                    {viewMode === 'map' && <InventoryMapView spaces={mapSpaces} navigate={navigate} />}
                </div>

                {viewMode !== 'map' && !loading && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalCount={totalCount}
                        itemsPerPage={limit}
                    />
                )}

                {/* Upload Modal */}
                {showUploadModal && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 animate-fadeIn">
                        <div className="bg-white rounded-2xl shadow-lg p-6 w-96 animate-scaleIn">
                            <h2 className="text-lg font-semibold mb-4 text-[var(--color-text)]">Upload Inventory Excel</h2>
                            <div className="mb-4">
                                <p className="mb-2 text-sm text-[var(--color-muted)]">
                                    Selected File: <span className="font-medium text-[var(--color-text)]">{selectedFile?.name}</span>
                                </p>
                                <p className="text-xs text-[var(--color-muted)]">
                                    Size: {selectedFile ? (selectedFile.size / 1024 / 1024).toFixed(2) : '0'}MB
                                </p>
                                <ValidationMessage message={fileError} />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setShowUploadModal(false);
                                        setSelectedFile(null);
                                        setFileError('');
                                    }}
                                    className="px-4 py-2 rounded-xl bg-gray-100 text-[var(--color-text)] hover:bg-gray-200 transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md"
                                    disabled={uploadLoading}
                                >
                                    Cancel
                                </button>
                                <Button
                                    onClick={handleConfirmUpload}
                                    disabled={!!fileError || !selectedFile}
                                    loading={uploadLoading}
                                >
                                    {uploadLoading ? 'Uploading...' : 'Save & Upload'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Image Preview Modal */}
                <ImagePreviewModal imageUrl={previewImageUrl} onClose={() => setPreviewImageUrl(null)} />
            </main>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes slideIn {
                    from {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes scaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes bg-gradient-flow-diagonal {
                    0% { background-position: 0% 0%; }
                    100% { background-position: 100% 100%; }
                }

                .animate-bg-gradient-flow-diagonal {
                    background-size: 200% 200%;
                    animation: bg-gradient-flow-diagonal 10s linear infinite;
                }

                .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
                .animate-slideUp { animation: slideUp 0.4s ease-out; }
                .animate-slideDown { animation: slideDown 0.4s ease-out; }
                .animate-slideIn { animation: slideIn 0.4s ease-out; }
                .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
            `}</style>
        </div>
    );
}