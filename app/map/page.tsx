'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { CrimeIncident, DashboardFilters } from '@/lib/types';
import FilterPanel from '@/components/dashboard/FilterPanel';
import SearchBar from '@/components/map/SearchBar';
import 'leaflet/dist/leaflet.css';

// Default center coordinates for Telangana
const DEFAULT_CENTER: [number, number] = [18.1124, 79.0193];
const DEFAULT_ZOOM = 7;

const MapWithNoSSR = dynamic(
  () => import('@/components/map/LeafletMap'),
  { ssr: false }
);

export default function MapPage() {
  const { data: session } = useSession();
  const [incidents, setIncidents] = useState<CrimeIncident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<CrimeIncident[]>([]);
  const [filters, setFilters] = useState<DashboardFilters>({
    dateRange: [new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()],
  });
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [incidentOpen, setIncidentOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/incidents?' + new URLSearchParams({
          startDate: filters.dateRange[0].toISOString(),
          endDate: filters.dateRange[1].toISOString(),
          crimeType: filters.crimeType || '',
        }));
        
        if (!response.ok) {
          throw new Error('Failed to fetch incidents');
        }
        
        const data = await response.json();
        
        // Filter out incidents without valid coordinates
        const validIncidents = data.filter((inc: CrimeIncident) => 
          inc.latitude && inc.longitude && 
          !isNaN(inc.latitude) && !isNaN(inc.longitude) &&
          inc.latitude !== 0 && inc.longitude !== 0
        );
        
        setIncidents(validIncidents);
        setFilteredIncidents(validIncidents);

        // Calculate center only if we have valid incidents and not manually set
        if (validIncidents.length > 0 && center === DEFAULT_CENTER) {
          const avgLat = validIncidents.reduce((sum: number, inc: CrimeIncident) => sum + inc.latitude, 0) / validIncidents.length;
          const avgLng = validIncidents.reduce((sum: number, inc: CrimeIncident) => sum + inc.longitude, 0) / validIncidents.length;
          
          if (!isNaN(avgLat) && !isNaN(avgLng)) {
            setCenter([avgLat, avgLng]);
          }
        }
      } catch (error) {
        console.error('Error fetching incidents:', error);
        setError('Failed to load incident data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  const handleLocationSelect = (lat: number, lng: number) => {
    setCenter([lat, lng]);
  };

  const handlePersonSelect = (relatedIncidents: CrimeIncident[]) => {
    setFilteredIncidents(relatedIncidents);
    
    // Calculate new center based on related incidents
    if (relatedIncidents.length > 0) {
      const avgLat = relatedIncidents.reduce((sum, inc) => sum + inc.latitude, 0) / relatedIncidents.length;
      const avgLng = relatedIncidents.reduce((sum, inc) => sum + inc.longitude, 0) / relatedIncidents.length;
      
      if (!isNaN(avgLat) && !isNaN(avgLng)) {
        setCenter([avgLat, avgLng]);
      }
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] relative bg-gray-100">
      {/* Controls Container */}
      {!incidentOpen && (
        <div className="absolute inset-x-0 top-0 z-20 bg-white/80 backdrop-blur-sm shadow-md p-4">
          <div className="max-w-7xl mx-auto space-y-4">
            <SearchBar 
              onLocationSelect={handleLocationSelect}
              onPersonSelect={handlePersonSelect}
              incidents={incidents}
            />
            <FilterPanel filters={filters} onFilterChange={setFilters} />
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className={`h-full transition-all duration-300 ${incidentOpen ? 'pt-4' : 'pt-32'}`}>
        {loading ? (
          <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
            <div className="text-gray-500">Loading map data...</div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 bg-red-50 flex items-center justify-center">
            <div className="text-red-600">{error}</div>
          </div>
        ) : (
          <MapWithNoSSR
            center={center}
            incidents={filteredIncidents}
            style={{ height: '100%', width: '100%' }}
            zoom={DEFAULT_ZOOM}
            onIncidentOpen={() => setIncidentOpen(true)}
            onIncidentClose={() => setIncidentOpen(false)}
          />
        )}
      </div>
    </div>
  );
} 