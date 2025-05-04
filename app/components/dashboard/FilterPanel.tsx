'use client';

import { useState } from 'react';
import { DashboardFilters } from '@/lib/types';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface FilterPanelProps {
  filters: DashboardFilters;
  onFilterChange: (filters: DashboardFilters) => void;
}

export default function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
  const [crimeTypes] = useState([
    'Theft',
    'Assault',
    'Burglary',
    'Robbery',
    'Vandalism',
    'Other'
  ]);

  const [roles] = useState([
    'Victim',
    'Suspect',
    'Witness',
    'Law Enforcement',
    'Other'
  ]);

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Range
          </label>
          <div className="flex gap-2">
            <DatePicker
              selected={filters.dateRange[0]}
              onChange={(date) =>
                onFilterChange({
                  ...filters,
                  dateRange: [date || new Date(), filters.dateRange[1]],
                })
              }
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <DatePicker
              selected={filters.dateRange[1]}
              onChange={(date) =>
                onFilterChange({
                  ...filters,
                  dateRange: [filters.dateRange[0], date || new Date()],
                })
              }
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Crime Type
          </label>
          <select
            value={filters.crimeType || ''}
            onChange={(e) =>
              onFilterChange({ ...filters, crimeType: e.target.value || undefined })
            }
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All Types</option>
            {crimeTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role
          </label>
          <select
            value={filters.role || ''}
            onChange={(e) =>
              onFilterChange({ ...filters, role: e.target.value || undefined })
            }
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All Roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location Radius (km)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={filters.location?.radius || 0}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                location: {
                  ...(filters.location || { lat: 0, lng: 0 }),
                  radius: parseInt(e.target.value) || 0,
                },
              })
            }
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>
    </div>
  );
} 