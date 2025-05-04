'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CrimeIncident, DashboardFilters, InsightSummary } from '@/lib/types';
import { LightBulbIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface InsightPanelProps {
  incidents: CrimeIncident[];
  filters: DashboardFilters;
}

export default function InsightPanel({ incidents, filters }: InsightPanelProps) {
  const [insights, setInsights] = useState<InsightSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const generateInsights = async () => {
      if (incidents.length === 0) {
        setInsights([]);
        setErrorMessage(null);
        return;
      }

      setLoading(true);
      setErrorMessage(null);
      try {
        const optimizedIncidents = incidents.map(
          ({
            id,
            title,
            publishedDate,
            newsType,
            location,
            keywords,
            description,
          }) => ({
            id,
            title,
            publishedDate,
            newsType,
            location,
            keywords,
            description,
          })
        );

        console.log(`Fetching insights for ${optimizedIncidents.length} incidents (optimized payload)`);

        const response = await fetch('/api/insights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            incidents: optimizedIncidents,
            filters,
            type: 'overview',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const message = errorData.message || `API request failed with status ${response.status}`;
          console.error('API Error:', response.status, errorData);
          throw new Error(message);
        }

        const data = await response.json();
        if (data && Array.isArray(data.insights)) {
          setInsights(data.insights);
        } else {
          console.warn('Unexpected API response structure:', data);
          setInsights([]);
        }

      } catch (error) {
        console.error('Error generating insights:', error);
        setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred.');
        setInsights([]);
      } finally {
        setLoading(false);
      }
    };

    generateInsights();
  }, [incidents, filters]);

  const refreshInsights = () => {
    setInsights([]);
    setErrorMessage(null);
    setLoading(true);
    const generateInsightsEffect = async () => {
      setLoading(false);
    };
    generateInsightsEffect();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center">
          <LightBulbIcon className="h-6 w-6 text-yellow-500 mr-2" />
          AI Insights
        </h2>
        <button
          onClick={refreshInsights}
          className="text-gray-400 hover:text-gray-600"
          title="Refresh insights"
          disabled={loading}
        >
          <ArrowPathIcon className="h-5 w-5" />
        </button>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-start">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2 flex-shrink-0" />
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}

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
          {insights.length > 0 ? (
            insights.map((insight, index) => (
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
            ))
          ) : (
            !errorMessage && (
              <div className="text-center text-gray-500">
                <p>No insights available for the current selection.</p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
} 