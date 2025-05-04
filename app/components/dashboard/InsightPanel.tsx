'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CrimeIncident, DashboardFilters, InsightSummary } from '@/lib/types';
import { LightBulbIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface InsightPanelProps {
  incidents: CrimeIncident[];
  filters: DashboardFilters;
}

// Define a safe maximum payload size in bytes (e.g., 4MB)
const MAX_PAYLOAD_SIZE_BYTES = 4 * 1024 * 1024; 

export default function InsightPanel({ incidents, filters }: InsightPanelProps) {
  const [insights, setInsights] = useState<InsightSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false); // State to track if data was truncated
  const [truncatedCount, setTruncatedCount] = useState(0); // State to store the count of truncated incidents

  useEffect(() => {
    const generateInsights = async () => {
      if (incidents.length === 0) {
        setInsights([]);
        setIsTruncated(false);
        return;
      }

      setLoading(true);
      setIsTruncated(false); // Reset truncation state
      let incidentsToSend = incidents;

      try {
        // Estimate payload size
        const payload = { incidents, filters };
        const jsonString = JSON.stringify(payload);
        const payloadSizeBytes = new TextEncoder().encode(jsonString).length;

        console.log(`Estimated payload size: ${(payloadSizeBytes / 1024 / 1024).toFixed(2)} MB`);

        if (payloadSizeBytes > MAX_PAYLOAD_SIZE_BYTES) {
          setIsTruncated(true);
          // Estimate how many incidents fit (very rough approximation)
          const avgIncidentSize = payloadSizeBytes / incidents.length;
          const estimatedCount = Math.floor(MAX_PAYLOAD_SIZE_BYTES / avgIncidentSize * 0.9); // 90% factor for safety
          
          // Ensure we take at least one incident if possible
          const countToSend = Math.max(1, estimatedCount); 
          incidentsToSend = incidents.slice(0, countToSend);
          setTruncatedCount(countToSend); // Store the count
          console.warn(`Payload too large (${(payloadSizeBytes / 1024 / 1024).toFixed(2)} MB). Truncating incidents to ${countToSend}.`);
        } else {
          setTruncatedCount(incidents.length); // Not truncated, use full count
        }

        // Optimize payload by sending only necessary fields (as done previously)
        const optimizedIncidents = incidentsToSend.map(({ 
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

        const requestBody = JSON.stringify({
          incidents: optimizedIncidents, // Send potentially truncated and optimized data
          filters,
        });

        // Debug: Log final request body size
        const finalPayloadSizeBytes = new TextEncoder().encode(requestBody).length;
        console.log(`Final request payload size: ${(finalPayloadSizeBytes / 1024 / 1024).toFixed(2)} MB for ${incidentsToSend.length} incidents.`);


        const response = await fetch('/api/insights', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: requestBody,
        });

        if (!response.ok) {
           // Handle non-OK responses, including potential 400 from backend validation
           const errorData = await response.json().catch(() => ({})); // Try parsing error JSON
           const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
           console.error('Error generating insights:', errorMessage);
           setInsights([{
             id: 'error',
             title: 'Analysis Error',
             description: errorMessage,
             type: 'anomaly',
             generatedAt: new Date(),
           }]);
           setLoading(false);
           return; // Stop execution on error
         }

        const data = await response.json();
        // Check if the backend returned insights or just a confirmation/empty object
        if (data && data.insights) {
            setInsights(data.insights);
        } else {
            // Handle cases where the backend might not return insights directly (e.g., different processing)
            // If data itself contains the insights array directly:
            setInsights(Array.isArray(data) ? data : []); 
        }

      } catch (error) {
        console.error('Error in generateInsights fetch:', error);
        setInsights([{
          id: 'fetch_error',
          title: 'Network Error',
          description: 'Could not fetch insights. Please check your connection and try again.',
          type: 'anomaly',
          generatedAt: new Date(),
        }]);
      }
      setLoading(false);
    };

    generateInsights();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidents, filters]); // Keep original dependencies

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

      {/* Display truncation warning */}
      {isTruncated && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-center text-sm text-yellow-700">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>Showing insights for the first {truncatedCount} incidents due to data size limits. Apply more filters for a complete analysis.</span>
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
          {Array.isArray(insights) && insights.map((insight, index) => (
            <motion.div
              key={insight.id || index}
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

          {(!Array.isArray(insights) || insights.length === 0) && !loading && (
            <div className="text-center text-gray-500">
              <p>No insights available for the current selection.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 