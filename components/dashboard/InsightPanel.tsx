'use client';

import { useState, useEffect } from 'react';
import { CrimeIncident } from '@/lib/types';

interface InsightPanelProps {
  incidents: CrimeIncident[];
}

const SECTION_TITLES = [
  'Key Patterns',
  'Risk Areas',
  'Recommendations',
  'Community Impact'
];

const SECTION_ICONS = [
  '📊', // Chart for Key Patterns
  '⚠️', // Warning for Risk Areas
  '💡', // Light bulb for Recommendations
  '🏘️', // Houses for Community Impact
];

// News types categorization helper function
function categorizeCrimeType(type: string): string {
  const typeClean = type.toLowerCase().trim();
  
  // Violent crimes
  if (['murder', 'homicide', 'assault', 'kidnapping', 'sexual harassment', 
       'child abuse', 'domestic violence', 'custodial deaths', 'mob violence'].includes(typeClean)) {
    return 'Violent Crime';
  }
  
  // Property crimes
  if (['theft', 'burglary', 'housebreaking', 'smuggling', 
       'property / real estate frauds', 'vehicle-related frauds'].includes(typeClean)) {
    return 'Property Crime';
  }
  
  // Drug-related
  if (['drug trafficking', 'drug possession', 'drug distribution', 
       'narcotics', 'drug seizure'].includes(typeClean)) {
    return 'Drug-Related';
  }
  
  // Cyber crimes
  if (['cyberbullying', 'online fraud', 'cyber attack', 
       'mobile sim card frauds', 'document & identity frauds'].includes(typeClean)) {
    return 'Cyber Crime';
  }
  
  // Financial crimes
  if (['corruption', 'money laundering', 'racketeering', 'extortion', 'syndicate',
       'investment frauds', 'financial / banking frauds', 'business / corporate frauds',
       'education / degree frauds', 'immigration / visa frauds',
       'employment / job-related frauds', 'matrimonial / relationship frauds',
       'cheating in overseas job offers', 'misuse of funds'].includes(typeClean)) {
    return 'Financial Crime';
  }
  
  // Political issues
  if (['protest', 'religious conflict', 'court cases', 'arrest', 'abuse of power',
       'cabinet reshuffle', 'national security policy', 'state vs. central government disputes',
       'political party', 'policy announcement', 'election campaign', 'party switching'].includes(typeClean)) {
    return 'Political';
  }
  
  // Accidents & hazards
  if (['accident', 'fatal accident', 'road accident', 'health hazard',
       'medical malpractice', 'utility failure', 'drunk and drive'].includes(typeClean)) {
    return 'Accident/Hazard';
  }
  
  // Community issues
  if (['child labor', 'municipal issues', 'local development', 'village news',
       'farmer issues', 'social awareness', 'inspection'].includes(typeClean)) {
    return 'Community Issue';
  }
  
  // Cultural/Social events
  if (['festival', 'cultural program', 'sports event', 'awards and achievements',
       'sympathy and condolence'].includes(typeClean)) {
    return 'Cultural/Social';
  }
  
  // Others
  return 'Other';
}

export default function InsightPanel({ incidents }: InsightPanelProps) {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    generateAIInsights();
  }, [incidents]);

  const generateAIInsights = async () => {
    if (!incidents.length) {
      setInsights([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    setErrorDetails(null);
    setProgress(0);

    try {
      console.log('Fetching insights for', incidents.length, 'incidents');
      
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          incidents,
          type: 'overview'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      // Check if the response is streaming
      const contentType = response.headers.get('content-type');
      const isStreaming = response.headers.get('transfer-encoding') === 'chunked';

      if (isStreaming) {
        // Handle streaming response
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Stream not available');
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          
          // Try to parse complete JSON objects from the buffer
          try {
            const data = JSON.parse(buffer);
            if (data.insights) {
              setInsights(data.insights);
              setProgress(100);
            }
            if (data.error) {
              throw new Error(data.error);
            }
            buffer = '';
          } catch (e) {
            // If parsing fails, keep the buffer for the next chunk
            continue;
          }
        }
      } else {
        // Handle regular JSON response
        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        if (!data.insights || !Array.isArray(data.insights)) {
          throw new Error('Invalid response format from insights API');
        }
        setInsights(data.insights);
        setProgress(100);
      }

      setRetryCount(0); // Reset retry count on success
    } catch (error) {
      console.error('Error generating insights:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Unable to generate insights. Please try again later.'
      );
      if (error instanceof Error && error.cause) {
        setErrorDetails(String(error.cause));
      }
      setInsights([]);
    }

    setLoading(false);
  };

  const handleRetry = () => {
    if (retryCount >= 3) {
      setError('Maximum retry attempts reached. Please try again later.');
      return;
    }
    setRetryCount(prev => prev + 1);
    generateAIInsights();
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">AI-Powered Insights</h2>
        <button
          onClick={handleRetry}
          disabled={loading || retryCount >= 3}
          className={`text-sm px-3 py-1 rounded-md transition-colors ${
            loading || retryCount >= 3
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          }`}
        >
          {loading ? 'Processing...' : 'Refresh Insights'}
        </button>
      </div>
      
      {error ? (
        <div className="p-4 bg-red-50 rounded-md">
          <p className="text-red-700 mb-2">{error}</p>
          {error.includes('Gemini API is not enabled') && (
            <div className="mt-2 text-sm">
              <p className="font-medium text-red-700">To fix this:</p>
              <ol className="list-decimal list-inside text-red-600 mt-1 space-y-1">
                <li>Go to the Google Cloud Console</li>
                <li>Navigate to APIs &amp; Services {`>`} Library</li>
                <li>Search for "Gemini API"</li>
                <li>Click Enable</li>
                <li>Wait a few minutes for the changes to take effect</li>
              </ol>
            </div>
          )}
          {errorDetails && (
            <p className="text-sm text-red-600 mb-2">Details: {errorDetails}</p>
          )}
          {retryCount < 3 && (
            <button
              onClick={handleRetry}
              className="text-sm text-red-600 hover:text-red-700 mt-2"
            >
              Try again
            </button>
          )}
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Generating insights...</span>
          {progress > 0 && (
            <div className="w-full max-w-md mt-4">
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-2 text-center">
                Processing {progress}% complete
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {insights.map((insight, index) => (
            <div key={index} className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">
                {index === 0 && 'Key Patterns'}
                {index === 1 && 'Risk Areas'}
                {index === 2 && 'Anomaly Flags'}
                {index === 3 && 'Recommendations'}
                {index === 4 && 'Community Impact'}
              </h3>
              <div className="text-gray-700 whitespace-pre-wrap">{insight}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 