'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { CrimeIncident } from '@/lib/types';

const MapWithNoSSR = dynamic(
  () => import('@/components/map/LeafletMap'),
  { ssr: false }
);

interface MapPreviewProps {
  incidents: CrimeIncident[];
}

const mapContainerStyle = {
  width: '100%',
  height: '300px',
};

const defaultCenter = {
  lat: 0,
  lng: 0,
};

export default function MapPreview({ incidents }: MapPreviewProps) {
  const [center, setCenter] = useState(defaultCenter);

  useEffect(() => {
    if (incidents.length > 0) {
      // Calculate the center of all incidents
      const avgLat =
        incidents.reduce((sum, inc) => sum + inc.latitude, 0) / incidents.length;
      const avgLng =
        incidents.reduce((sum, inc) => sum + inc.longitude, 0) / incidents.length;
      setCenter({ lat: avgLat, lng: avgLng });
    }
  }, [incidents]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Incident Map</h2>
      <div className="rounded-lg overflow-hidden">
        <MapWithNoSSR
          center={center}
          incidents={incidents}
          style={mapContainerStyle}
        />
      </div>
    </div>
  );
} 