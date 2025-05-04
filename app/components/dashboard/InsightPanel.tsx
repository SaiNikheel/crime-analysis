'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CrimeIncident, DashboardFilters } from '@/lib/types';
import { LightBulbIcon, ArrowPathIcon, CloudArrowDownIcon } from '@heroicons/react/24/outline';

interface InsightPanelProps {
  incidents: CrimeIncident[];
  filters: DashboardFilters;
}

const SECTION_TITLES = [
  'Key Patterns',
  'Risk Areas',
  'Recommendations',
  'Community Impact'
];
const SECTION_ICONS = [
  '📊', '⚠️', '💡', '🏘️',
];

export default function InsightPanel({ incidents, filters }: InsightPanelProps) {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState<boolean>(false);

  useEffect(() => {
    const generateInsights = async () => {
      setLoading(true);
      setError(null);
      setIsCached(false);
      try {
        const optimizedIncidents = incidents.map(({ 
          id, 
          newsType, 
          publishedDate,
          latitude, 
          longitude 
        }) => ({
          id,
          newsType,
          date: publishedDate,
          latitude,
          longitude
        }));

        const response = await fetch('/api/insights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            incidents: optimizedIncidents,
            filters,
            type: 'overview'
          }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `API request failed with status ${response.status}`);
        }

        if (data.error) {
            throw new Error(data.error);
        }

        if (!Array.isArray(data.insights) || data.insights.some((item: any) => typeof item !== 'string')) {
            console.error('Invalid insights format received from API:', data.insights);
            throw new Error('Received invalid insights format from server.');
        }

        setInsights(data.insights);
        setIsCached(data.cached === true);

      } catch (err) {
        console.error('Error generating insights:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch insights.');
        setInsights([]);
      }
      setLoading(false);
    };

    if (incidents.length > 0) {
      generateInsights();
    } else {
        setInsights([]);
        setLoading(false);
        setError(null);
        setIsCached(false);
    }
  }, [incidents, filters]);

  const parseInsightPoints = (insightText: string): string[] => {
    if (!insightText) return [];
    return insightText
      .split('\n')
      .map(point => point.trim())
      .filter(point => point.length > 0);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 relative">
      {isCached && (
          <div 
            className="absolute top-2 right-2 flex items-center bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full"
            title="Showing previously saved insights due to an issue generating fresh data."
          >
             <CloudArrowDownIcon className="w-4 h-4 mr-1" />
             Cached
          </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <LightBulbIcon className="h-6 w-6 text-yellow-500 mr-2" />
          AI Insights
        </h2>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="space-y-3 mt-4">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
         <div className="p-4 bg-red-50 rounded-md text-red-700">
            <p className="font-medium">Error generating insights:</p>
            <p className="text-sm mt-1">{error}</p>
         </div>
      ) : (
        <div className="space-y-6">
          {insights.length > 0 ? insights.map((insightSectionText, index) => {
            if (index >= SECTION_TITLES.length) return null;
            
            const points = parseInsightPoints(insightSectionText);
            if (points.length === 0) return null;
            
            return (
              <motion.div
                key={index} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border-b border-gray-200 pb-4 last:border-b-0"
              >
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl">{SECTION_ICONS[index]}</span>
                    <h3 className="font-medium text-gray-900">
                        {SECTION_TITLES[index]}
                    </h3>
                </div>
                <ul className="space-y-2 pl-4">
                  {points.map((point, pointIndex) => (
                    <li key={pointIndex} className="text-gray-600 text-sm list-disc list-outside marker:text-blue-500">
                      {point}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          }) : (
            <div className="text-center text-gray-500 py-8">
              <p>No insights available for the current selection.</p>
              <p className="text-xs mt-1">Try adjusting filters or loading data.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 