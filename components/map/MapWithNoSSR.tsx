'use client';

import dynamic from 'next/dynamic';
import { CrimeIncident } from '@/lib/types';

// Dynamically import the LeafletMap component with no SSR
const LeafletMap = dynamic(
  () => import('./LeafletMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <p className="text-gray-500">Loading map...</p>
      </div>
    ),
  }
);

interface MapWithNoSSRProps {
  center: [number, number];
  zoom?: number;
  incidents?: Partial<CrimeIncident>[];
  style?: React.CSSProperties;
  onIncidentOpen?: () => void;
  onIncidentClose?: () => void;
}

export default function MapWithNoSSR(props: MapWithNoSSRProps) {
  return <LeafletMap {...props} />;
} 