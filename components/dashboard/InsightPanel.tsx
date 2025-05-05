'use client';

import { useState, useEffect } from 'react';
import { CrimeIncident, DashboardFilters } from '@/lib/types';

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
  '📊', // Chart for Key Patterns
  '⚠️', // Warning for Risk Areas
  '💡', // Light bulb for Recommendations
  '🏘️', // Houses for Community Impact
];

export default function InsightPanel({ incidents, filters }: InsightPanelProps) {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (filters) {
      generateAIInsights();
    }
  }, [filters]);

  const generateAIInsights = async () => {
    if (!incidents.length) {
      console.log('Incidents array is empty, but filters exist. Proceeding with API call using filters.');
    }

    if (!filters) {
      console.log('No filters provided, skipping insight generation.');
      setLoading(false);
      setInsights([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    setErrorDetails(null);

    try {
      console.log('Fetching insights using filters:', filters);
      
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters,
          type: 'overview'
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Invalid content type:', contentType);
        throw new Error('Invalid response format from server');
      }

      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.error || `Server error: ${response.status}`;
        if (errorMessage.includes('Gemini API is not enabled')) {
          throw new Error(data.error);
        }
        if (errorMessage.includes('Gemini API') || errorMessage.includes('generativelanguage.googleapis.com')) {
          throw new Error('The AI service is not properly configured. Please check your API key and try again.');
        }
        throw new Error(errorMessage);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.insights || !Array.isArray(data.insights)) {
        throw new Error('Invalid response format from insights API');
      }

      console.log('Successfully received insights:', data.insights.length);
      setInsights(data.insights);
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

  // Helper function to parse insights
  const parseInsightPoints = (insightText: string): string[] => {
    if (!insightText) return [];
    return insightText
      .split('\n')
      .filter(point => point.trim().length > 0);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">AI-Powered Insights</h2>
          <div className="text-sm text-gray-500">Analyzing data...</div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="mt-6 h-24 bg-gray-100 rounded flex items-center justify-center">
            <div className="text-gray-400">Processing {incidents.length} incidents...</div>
          </div>
        </div>
      </div>
    );
  }

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
      ) : insights.length > 0 ? (
        <div className="grid grid-cols-1 gap-8">
          {insights.map((insight, index) => {
            const points = parseInsightPoints(insight);
            if (points.length === 0) return null;
            
            return (
              <div 
                key={index} 
                className="bg-gray-50 rounded-lg p-6"
              >
                <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-200">
                  <span className="text-2xl">{SECTION_ICONS[index]}</span>
                  <h3 className="text-xl font-medium text-gray-900">
                    {SECTION_TITLES[index]}
                  </h3>
                </div>
                <div className="space-y-4">
                  {points.map((point, pointIndex) => (
                    <div
                      key={pointIndex}
                      className="flex items-start gap-3 group"
                    >
                      <span className="text-blue-500 font-bold mt-1">→</span>
                      <p className="text-gray-700 leading-relaxed">
                        {point}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500 italic">
          No insights available. Please load data to generate analysis.
        </p>
      )}

      <div className="mt-8 pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Insights are generated using AI analysis based on the current filters. 
          Last updated: {new Date().toLocaleTimeString()}
        </p>
        {retryCount > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            Retry attempt {retryCount} of 3
          </p>
        )}
      </div>
    </div>
  );
} 