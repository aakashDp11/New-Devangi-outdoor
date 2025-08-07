// MapPreview.js
import React, { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapPreview({ latitude, longitude }) {
  useEffect(() => {
    const map = L.map('map-preview').setView([latitude, longitude], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
    }).addTo(map);

    L.marker([latitude, longitude]).addTo(map);

    return () => {
      map.remove(); // cleanup
    };
  }, [latitude, longitude]);

  return <div id="map-preview" className="w-full h-64 rounded border" />;
}
