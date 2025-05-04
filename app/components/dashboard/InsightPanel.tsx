'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CrimeIncident, DashboardFilters, InsightSummary } from '@/lib/types';
import { LightBulbIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface InsightPanelProps {
  incidents: CrimeIncident[];
  filters: DashboardFilters;
}

export default function InsightPanel({ incidents, filters }: InsightPanelProps) {
  const [insights, setInsights] = useState<InsightSummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const generateInsights = async () => {
      setLoading(true);
      try {
        // Limit the data to the first 50 incidents
        const limitedIncidents = incidents.slice(0, 50);

        const response = await fetch('/api/insights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            incidents: limitedIncidents, // Send limited data
            filters,
            type: 'overview', // Explicitly set type for overview insights
          }),
        });

        if (!response.ok) {
          // Handle potential errors from the API (like the old size validation)
          const errorData = await response.json().catch(() => ({})); // Try to parse error JSON, default to empty object
          console.error('Error response from API:', response.status, errorData);
          throw new Error(errorData.message || `API error: ${response.status}`);
        }

        const data = await response.json();
        // Assuming the API returns { insights: [...] } for the 'overview' type
        setInsights(data.insights || []);

      } catch (error) {
        console.error('Error generating insights:', error);
        // Display a user-friendly error message
        setInsights([{
          id: 'analysis-error',
          title: 'Insight Generation Failed',
          description: error instanceof Error ? error.message : 'Could not generate insights. The analysis might require fewer incidents or different filters. Please try again later.',
          type: 'anomaly',
          generatedAt: new Date()
        }]);
      }
      setLoading(false);
    };

    if (incidents.length > 0) {
      generateInsights();
    }
  }, [incidents, filters]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <LightBulbIcon className="h-6 w-6 text-yellow-500 mr-2" />
          AI Insights
        </h2>
        <button
          onClick={() => setInsights([])}
          className="text-gray-400 hover:text-gray-600"
          title="Refresh insights"
        >
          <ArrowPathIcon className="h-5 w-5" />
        </button>
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
      ) : (
        <div className="space-y-6">
          {insights.map((insight, index) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border-b border-gray-200 pb-4 last:border-b-0"
            >
              <h3 className="font-medium text-gray-900 mb-2">{insight.title}</h3>
              <p className="text-gray-600 text-sm">{insight.description}</p>
              {insight.data && (
                <div className="mt-2 text-sm text-gray-500">
                  {/* Render additional insight data based on type */}
                  {insight.type === 'hotspot' && (
                    <ul className="list-disc list-inside">
                      {insight.data.locations.map((loc: string, i: number) => (
                        <li key={i}>{loc}</li>
                      ))}
                    </ul>
                  )}
                  {insight.type === 'trend' && (
                    <p className="italic">{insight.data.trendDescription}</p>
                  )}
                </div>
              )}
            </motion.div>
          ))}

          {insights.length === 0 && !loading && (
            <div className="text-center text-gray-500">
              <p>No insights available for the current selection.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 