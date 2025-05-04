'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { CrimeIncident } from '@/lib/types';

// Import the map component with no SSR
const MapWithNoSSR = dynamic(
  () => import('@/components/map/LeafletMap'),
  { ssr: false }
);

interface MapPreviewProps {
  incidents: CrimeIncident[];
}

// Default location for Telangana region
const defaultCenter: [number, number] = [18.1124, 79.0193];

export default function MapPreview({ incidents }: MapPreviewProps) {
  const [center, setCenter] = useState<[number, number]>(defaultCenter);

  useEffect(() => {
    if (incidents.length > 0) {
      // Calculate the center based on incidents
      try {
        const validIncidents = incidents.filter(
          inc => !isNaN(inc.latitude) && !isNaN(inc.longitude) && 
                inc.latitude !== 0 && inc.longitude !== 0
        );
        
        if (validIncidents.length > 0) {
          const avgLat = validIncidents.reduce((sum, inc) => sum + inc.latitude, 0) / validIncidents.length;
          const avgLng = validIncidents.reduce((sum, inc) => sum + inc.longitude, 0) / validIncidents.length;
          
          if (!isNaN(avgLat) && !isNaN(avgLng)) {
            setCenter([avgLat, avgLng]);
          }
        }
      } catch (error) {
        console.error('Error calculating map center:', error);
      }
    }
  }, [incidents]);

  // Category color mapping for legend
  const categoryColors = [
    { category: 'Violent Crime', color: '#ef4444' },
    { category: 'Property Crime', color: '#f97316' },
    { category: 'Drug-Related', color: '#8b5cf6' },
    { category: 'Cyber Crime', color: '#3b82f6' },
    { category: 'Financial Crime', color: '#14b8a6' },
    { category: 'Political', color: '#6366f1' },
    { category: 'Accident/Hazard', color: '#f59e0b' },
    { category: 'Community Issue', color: '#10b981' },
    { category: 'Cultural/Social', color: '#ec4899' },
    { category: 'Other', color: '#6b7280' }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Incident Map</h2>
      <div className="w-full h-[500px] rounded-lg overflow-hidden">
        {incidents && Array.isArray(incidents) && (
          <MapWithNoSSR
            center={center}
            incidents={incidents as any}
            zoom={8}
          />
        )}
      </div>
    </div>
  );
} 