'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CrimeIncident, DashboardFilters, InsightSummary } from '@/lib/types';
import { LightBulbIcon, ArrowPathIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface InsightPanelProps {
  incidents: CrimeIncident[];
  filters: DashboardFilters;
}

const MAX_PAYLOAD_SIZE_BYTES = 4.5 * 1024 * 1024; // Approx 4.5MB limit

export default function InsightPanel({ incidents, filters }: InsightPanelProps) {
  const [insights, setInsights] = useState<InsightSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false); // State for truncation message
  const [processedCount, setProcessedCount] = useState(0); // State for number of incidents processed

  useEffect(() => {
    const generateInsights = async () => {
      if (incidents.length === 0) {
        setInsights([]);
        setIsTruncated(false);
        setProcessedCount(0);
        return;
      }

      setLoading(true);
      setIsTruncated(false); // Reset truncation state
      setProcessedCount(0); // Reset count

      try {
        // Optimize payload by sending only necessary fields
        let optimizedIncidents = incidents.map(({
          id,
          newsType,
          publishedDate,
          latitude,
          longitude
        }) => ({
          id,
          newsType,
          publishedDate,
          latitude,
          longitude
        }));

        let payload = { incidents: optimizedIncidents, filters };
        let payloadString = JSON.stringify(payload);
        let payloadSize = new TextEncoder().encode(payloadString).length;

        // Truncate if payload exceeds the limit
        if (payloadSize > MAX_PAYLOAD_SIZE_BYTES) {
          console.warn(`Payload size (${(payloadSize / 1024 / 1024).toFixed(2)}MB) exceeds limit. Truncating incidents.`);
          setIsTruncated(true); // Set truncation flag

          // Estimate average size per incident to quickly reduce size
          const avgSizePerIncident = payloadSize / optimizedIncidents.length;
          let targetIncidentCount = Math.floor(MAX_PAYLOAD_SIZE_BYTES / avgSizePerIncident);

          // Reduce incidents and recalculate size until it fits
          while (payloadSize > MAX_PAYLOAD_SIZE_BYTES && targetIncidentCount > 0) {
            optimizedIncidents = optimizedIncidents.slice(0, targetIncidentCount);
            payload = { incidents: optimizedIncidents, filters };
            payloadString = JSON.stringify(payload);
            payloadSize = new TextEncoder().encode(payloadString).length;
            // Further reduce if still too large
             if (payloadSize > MAX_PAYLOAD_SIZE_BYTES) {
                targetIncidentCount = Math.floor(targetIncidentCount * 0.9); // Reduce by 10%
             }
          }
          console.log(`Truncated to ${optimizedIncidents.length} incidents. Final size: ${(payloadSize / 1024 / 1024).toFixed(2)}MB`);
        }

        setProcessedCount(optimizedIncidents.length); // Set the actual count sent

        // Check if any incidents remain after truncation
        if (optimizedIncidents.length === 0) {
             console.error("Payload limit too small, cannot process any incidents.");
             throw new Error("Data too large to process even after truncation.");
        }

        const response = await fetch('/api/insights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          // Send the potentially truncated payload string
          body: payloadString,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
          console.error('API Error:', response.status, errorData);
          throw new Error(`API request failed: ${response.status} ${errorData.error || ''}`);
        }

        const data = await response.json();
        // Assuming the API returns { insights: [...] }
        setInsights(data.insights || data || []);

      } catch (error) {
        console.error('Error generating insights:', error);
        setInsights([{
          id: 'error',
          title: 'Analysis Error',
          description: `Could not generate insights. ${error instanceof Error ? error.message : 'Please try again later or adjust filters.'}`,
          type: 'anomaly',
          generatedAt: new Date()
        }]);
      } finally {
        setLoading(false);
      }
    };

    generateInsights();

  }, [incidents, filters]); // Rerun when incidents or filters change

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4"> {/* Reduced bottom margin */}
        <h2 className="text-xl font-semibold flex items-center">
          <LightBulbIcon className="h-6 w-6 text-yellow-500 mr-2" />
          AI Insights
        </h2>
        {/* Refresh button removed as effect handles updates */}
      </div>

       {/* Truncation Info Message */}
       {isTruncated && (
         <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-700 flex items-center">
           <InformationCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
           <span>
             Displaying insights for the first {processedCount.toLocaleString()} incidents due to data size limits. Apply more filters for a complete analysis.
           </span>
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