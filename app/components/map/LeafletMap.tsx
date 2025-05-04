'use client';

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { CrimeIncident } from '@/lib/types';

interface LeafletMapProps {
  center: {
    lat: number;
    lng: number;
  };
  incidents: CrimeIncident[];
  style?: React.CSSProperties;
  zoom?: number;
}

export default function LeafletMap({
  center,
  incidents,
  style,
  zoom = 12,
}: LeafletMapProps) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      style={style}
      className="rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {incidents.map((incident) => (
        <CircleMarker
          key={incident.id}
          center={[incident.latitude, incident.longitude]}
          radius={6}
          fillColor="#ef4444"
          color="#dc2626"
          weight={1}
          opacity={0.8}
          fillOpacity={0.6}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{incident.newsType}</p>
              <p className="text-gray-600">
                {new Date(incident.publishedDate).toLocaleDateString()}
              </p>
              {incident.involvedPersonsRole && (
                <p className="text-gray-500">
                  Role: {incident.involvedPersonsRole}
                </p>
              )}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
} 