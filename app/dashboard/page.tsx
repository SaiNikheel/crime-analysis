'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { CrimeIncident } from '@/lib/types';
import OverviewCard from '@/components/dashboard/OverviewCard';
import InsightPanel from '@/components/dashboard/InsightPanel';
import MapPreview from '@/components/dashboard/MapPreview';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function DashboardPage() {
  const { data: session } = useSession();
  const { trackEvent } = useAnalytics();
  const [incidents, setIncidents] = useState<CrimeIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week'|'month'|'year'>('month');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/incidents');
        const data = await response.json();
        setIncidents(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching incidents:', error);
        setIncidents([]);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  // Get recent incidents based on timeframe
  const getRecentIncidents = () => {
    const now = new Date();
    let cutoff = new Date();
    
    switch(timeframe) {
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    return incidents.filter(incident => new Date(incident.publishedDate) >= cutoff);
  };

  const recentIncidents = getRecentIncidents();

  // Prepare data for charts
  const incidentsByMonth = incidents.reduce((acc: Record<string, number>, incident: CrimeIncident) => {
    const month = new Date(incident.publishedDate).toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const crimeTypes = incidents.reduce((acc: Record<string, number>, incident: CrimeIncident) => {
    acc[incident.newsType] = (acc[incident.newsType] || 0) + 1;
    return acc;
  }, {});

  const top5CrimeTypes = Object.entries(crimeTypes)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Group by locations for hotspot analysis
  const locationCounts = incidents.reduce((acc: Record<string, number>, incident: CrimeIncident) => {
    const locationKey = incident.location || `${incident.latitude.toFixed(4)},${incident.longitude.toFixed(4)}`;
    acc[locationKey] = (acc[locationKey] || 0) + 1;
    return acc;
  }, {});

  const topLocations = Object.entries(locationCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Count by time of day for temporal analysis
  const timeOfDayCounts = incidents.reduce((acc: Record<string, number>, incident: CrimeIncident) => {
    let hour = 0;
    try {
      const date = new Date(incident.publishedDate);
      hour = date.getHours();
    } catch (e) {
      // Default to morning if date parsing fails
      hour = 9;
    }

    let timeCategory = 'Unknown';
    if (hour >= 5 && hour < 12) timeCategory = 'Morning (5AM-12PM)';
    else if (hour >= 12 && hour < 17) timeCategory = 'Afternoon (12PM-5PM)';
    else if (hour >= 17 && hour < 21) timeCategory = 'Evening (5PM-9PM)';
    else timeCategory = 'Night (9PM-5AM)';
    
    acc[timeCategory] = (acc[timeCategory] || 0) + 1;
    return acc;
  }, {});

  const totalIncidents = incidents.length;
  const recentIncidentsCount = recentIncidents.length;
  
  // Calculate rate change
  const previousPeriodCount = incidents.filter(incident => {
    const date = new Date(incident.publishedDate);
    const now = new Date();
    const cutoff = new Date();
    const previousCutoff = new Date();
    
    switch(timeframe) {
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        previousCutoff.setDate(cutoff.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(now.getMonth() - 1);
        previousCutoff.setMonth(cutoff.getMonth() - 1);
        break;
      case 'year':
        cutoff.setFullYear(now.getFullYear() - 1);
        previousCutoff.setFullYear(cutoff.getFullYear() - 1);
        break;
    }
    
    return date >= previousCutoff && date < cutoff;
  }).length;
  
  const rateChange = previousPeriodCount > 0 
    ? Math.round((recentIncidentsCount - previousPeriodCount) / previousPeriodCount * 100) 
    : 0;

  // Track timeframe changes
  const handleTimeframeChange = (newTimeframe: 'week'|'month'|'year') => {
    setTimeframe(newTimeframe);
    trackEvent('timeframe_change', { timeframe: newTimeframe });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-4">News Analysis Dashboard</h1>
        <div className="flex gap-4 mb-6">
          <button 
            onClick={() => handleTimeframeChange('week')} 
            className={`px-4 py-2 rounded ${timeframe === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Weekly
          </button>
          <button 
            onClick={() => handleTimeframeChange('month')} 
            className={`px-4 py-2 rounded ${timeframe === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Monthly
          </button>
          <button 
            onClick={() => handleTimeframeChange('year')} 
            className={`px-4 py-2 rounded ${timeframe === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Yearly
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <OverviewCard
          title="Total Incidents"
          value={totalIncidents}
          trend={null}
          loading={loading}
        />
        <OverviewCard
          title={`${timeframe === 'week' ? 'This Week' : timeframe === 'month' ? 'This Month' : 'This Year'}`}
          value={recentIncidentsCount}
          trend={rateChange}
          loading={loading}
        />
        <OverviewCard
          title="Hotspot Locations"
          value={topLocations.length}
          loading={loading}
        />
        <OverviewCard
          title="Active News Types"
          value={Object.keys(crimeTypes).length}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h2 className="text-xl font-semibold mb-4">Incidents Over Time</h2>
          <Line
            data={{
              labels: Object.keys(incidentsByMonth),
              datasets: [{
                label: 'Incidents',
                data: Object.values(incidentsByMonth),
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
              }]
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
                tooltip: {
                  callbacks: {
                    label: function(context) {
                      return `Incidents: ${context.raw}`;
                    }
                  }
                }
              }
            }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h2 className="text-xl font-semibold mb-4">Top News Types</h2>
          <Bar
            data={{
              labels: top5CrimeTypes.map(([type]) => type),
              datasets: [{
                label: 'Incidents',
                data: top5CrimeTypes.map(([, count]) => count),
                backgroundColor: [
                  'rgba(255, 99, 132, 0.6)',   // pink
                  'rgba(54, 162, 235, 0.6)',   // blue
                  'rgba(255, 206, 86, 0.6)',   // yellow
                  'rgba(75, 192, 192, 0.6)',   // teal
                  'rgba(153, 102, 255, 0.6)',  // purple
                ],
              }]
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
              }
            }}
          />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h2 className="text-xl font-semibold mb-4">Crime Hotspots</h2>
          <div className="h-64 overflow-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 text-left">Location</th>
                  <th className="py-2 px-4 text-right">Incidents</th>
                  <th className="py-2 px-4 text-right">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {topLocations.map(([location, count], index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="py-2 px-4">{location}</td>
                    <td className="py-2 px-4 text-right">{count}</td>
                    <td className="py-2 px-4 text-right">
                      {(count / totalIncidents * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h2 className="text-xl font-semibold mb-4">Time of Day Analysis</h2>
          <div className="h-64 flex items-center justify-center">
            <Pie
              data={{
                labels: Object.keys(timeOfDayCounts),
                datasets: [{
                  data: Object.values(timeOfDayCounts),
                  backgroundColor: [
                    'rgba(255, 206, 86, 0.6)', // Morning - yellow
                    'rgba(75, 192, 192, 0.6)', // Afternoon - teal
                    'rgba(153, 102, 255, 0.6)', // Evening - purple
                    'rgba(54, 162, 235, 0.6)', // Night - blue
                  ],
                  borderWidth: 1,
                }]
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom' as const,
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const value = context.raw as number;
                        const total = (context.chart.data.datasets[0].data as number[]).reduce((a, b) => (a as number) + (b as number), 0) as number;
                        const percentage = Math.round((value / total) * 100);
                        return `${context.label}: ${value} (${percentage}%)`;
                      }
                    }
                  }
                }
              }}
            />
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MapPreview incidents={incidents} />
        </div>
        <div>
          <InsightPanel incidents={incidents} />
        </div>
      </div>
    </div>
  );
} 