import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- CHANGE 1: Add a fix for the default marker icon path ---
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;
// --- END CHANGE 1 ---


// --- CHANGE 2: Accept `spaceName` as a prop with a default value ---
export default function MapPreview({ latitude, longitude, spaceName = 'Location' }) {
  
  // --- CHANGE 3: Use useRef to manage the map container and instance ---
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  // --- END CHANGE 3 ---

  useEffect(() => {
    // Only initialize the map if the container exists and the map isn't already created
    if (mapContainerRef.current && !mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([latitude, longitude], 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Store the map instance in the ref
      mapInstanceRef.current = map;
    }

    // This block will run every time the props change
    if (mapInstanceRef.current) {
      const map = mapInstanceRef.current;
      
      // Clear any old markers before adding a new one
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          map.removeLayer(layer);
        }
      });

      // --- CHANGE 4: Add the new marker with a tooltip ---
      // Create the content for the hover tooltip
      const tooltipContent = `
        <div style="text-align: left;">
          <strong style="font-size: 1.1em;">${spaceName}</strong><br/>
          Latitude: ${latitude}<br/>
          Longitude: ${longitude}
        </div>
      `;

      // Add a marker to the map and bind the tooltip to it
      L.marker([latitude, longitude])
        .addTo(map)
        .bindTooltip(tooltipContent);
      // --- END CHANGE 4 ---

      // Ensure the map is centered on the correct coordinates
      map.setView([latitude, longitude]);
    }

    // Cleanup function is no longer needed here because we manage the instance with a ref
    
  }, [latitude, longitude, spaceName]); // Add spaceName to the dependency array

  // --- CHANGE 5: Use the ref for the div instead of a string ID ---
  return <div ref={mapContainerRef} className="w-full h-full rounded border" />;
}