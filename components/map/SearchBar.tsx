'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, MapPinIcon, UserIcon } from '@heroicons/react/24/outline';
import { debounce } from 'lodash';

interface LocationResult {
  lat: string;
  lon: string;
  display_name: string;
}

interface PersonResult {
  id: string;
  name: string;
  role: string;
  newsType: string;
  location: string;
  date: string;
}

interface SearchBarProps {
  onLocationSelect: (lat: number, lng: number) => void;
  onPersonSelect?: (incidents: any[]) => void;
  incidents?: any[];
}

type SearchType = 'location' | 'person';

export default function SearchBar({ onLocationSelect, onPersonSelect, incidents = [] }: SearchBarProps) {
  const [searchType, setSearchType] = useState<SearchType>('location');
  const [searchTerm, setSearchTerm] = useState('');
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [personResults, setPersonResults] = useState<PersonResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchLocation = debounce(async (query: string) => {
    if (!query) {
      setLocationResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&limit=5`
      );
      const data = await response.json();
      setLocationResults(data);
    } catch (error) {
      console.error('Error searching location:', error);
    }
    setIsLoading(false);
  }, 300);

  const searchPerson = debounce((query: string) => {
    if (!query) {
      setPersonResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Search in incident descriptions, names, and roles
      const results = incidents.filter(incident => {
        const searchTermLower = query.toLowerCase();
        const descriptionMatch = incident.description?.toLowerCase().includes(searchTermLower);
        const involvedPersonsMatch = incident.involvedPersonsRole?.toLowerCase().includes(searchTermLower);
        const titleMatch = incident.title?.toLowerCase().includes(searchTermLower);
        
        return descriptionMatch || involvedPersonsMatch || titleMatch;
      }).map(incident => ({
        id: incident.id,
        name: incident.title,
        role: incident.involvedPersonsRole,
        newsType: incident.newsType,
        location: incident.location,
        date: incident.publishedDate
      }));

      setPersonResults(results.slice(0, 5)); // Limit to 5 results
    } catch (error) {
      console.error('Error searching person:', error);
    }
    setIsLoading(false);
  }, 300);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowResults(true);
    
    if (searchType === 'location') {
      searchLocation(value);
    } else {
      searchPerson(value);
    }
  };

  const handleLocationSelect = (result: LocationResult) => {
    setSearchTerm(result.display_name);
    setShowResults(false);
    onLocationSelect(parseFloat(result.lat), parseFloat(result.lon));
  };

  const handlePersonSelect = (result: PersonResult) => {
    setSearchTerm(result.name);
    setShowResults(false);
    if (onPersonSelect) {
      const relatedIncidents = incidents.filter(inc => 
        inc.id === result.id || 
        inc.description?.toLowerCase().includes(result.name.toLowerCase()) ||
        inc.involvedPersonsRole?.toLowerCase().includes(result.name.toLowerCase())
      );
      onPersonSelect(relatedIncidents);
    }
  };

  const toggleSearchType = () => {
    setSearchType(prev => prev === 'location' ? 'person' : 'location');
    setSearchTerm('');
    setLocationResults([]);
    setPersonResults([]);
    setShowResults(false);
  };

  return (
    <div className="relative">
      <div className="flex gap-2 mb-2">
        <button
          onClick={toggleSearchType}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            searchType === 'location'
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <MapPinIcon className="h-4 w-4" />
          Location
        </button>
        <button
          onClick={toggleSearchType}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            searchType === 'person'
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <UserIcon className="h-4 w-4" />
          Person
        </button>
      </div>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          onFocus={() => setShowResults(true)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder={searchType === 'location' ? "Search locations..." : "Search people in incidents..."}
        />
      </div>

      {showResults && ((locationResults.length > 0 || personResults.length > 0) || isLoading) && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md py-1 text-sm">
          {isLoading ? (
            <div className="px-4 py-2 text-gray-500">Searching...</div>
          ) : searchType === 'location' ? (
            locationResults.map((result, index) => (
              <button
                key={index}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none"
                onClick={() => handleLocationSelect(result)}
              >
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-gray-400" />
                  <span>{result.display_name}</span>
                </div>
              </button>
            ))
          ) : (
            personResults.map((result, index) => (
              <button
                key={index}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none"
                onClick={() => handlePersonSelect(result)}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{result.name}</span>
                  </div>
                  <div className="ml-6 text-xs text-gray-500">
                    <span>{result.newsType}</span>
                    {result.role && <span> • {result.role}</span>}
                    <span> • {new Date(result.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
} 