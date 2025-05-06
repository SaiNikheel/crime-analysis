'use client';

import { useState, useRef, useCallback } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { debounce } from 'lodash';

interface SearchResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface LocationSearchBarProps {
  onLocationSelect: (lat: number, lng: number) => void;
}

export default function LocationSearchBar({ onLocationSelect }: LocationSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const fetchingQueryRef = useRef<string | null>(null);

  const searchLocation = useCallback(
    debounce(async (query: string) => {
      if (!query) {
        setResults([]);
        setIsLoading(false);
        fetchingQueryRef.current = null;
        return;
      }

      fetchingQueryRef.current = query;
      setIsLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
        );
        const data = await response.json();

        if (fetchingQueryRef.current === query) {
          setResults(data);
        }
      } catch (error) {
        console.error('Error searching location:', error);
        if (fetchingQueryRef.current === query) {
          setResults([]);
        }
      } finally {
        if (fetchingQueryRef.current === query) {
          setIsLoading(false);
        }
      }
    }, 300),
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowResults(true);
    searchLocation(value);
  };

  const handleSelect = (result: SearchResult) => {
    setSearchTerm(result.display_name);
    setShowResults(false);
    onLocationSelect(parseFloat(result.lat), parseFloat(result.lon));
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MapPinIcon className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        onFocus={() => setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 150)}
        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        placeholder="Search locations (e.g., city, address)..."
      />
      {showResults && (searchTerm.length > 0) && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-sm max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-2 text-gray-500 italic">Searching...</div>
          ) : results.length > 0 ? (
            results.map((result, index) => (
              <button
                key={result.lat + result.lon + index}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none"
                onMouseDown={() => handleSelect(result)}
              >
                {result.display_name}
              </button>
            ))
          ) : (
             !isLoading && searchTerm && <div className="px-4 py-2 text-gray-500">No locations found.</div>
          )}
        </div>
      )}
    </div>
  );
} 