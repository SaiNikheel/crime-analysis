'use client';

import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface OverviewCardProps {
  title: string;
  value: number;
  trend?: number | null;
  loading?: boolean;
}

export default function OverviewCard({
  title,
  value,
  trend,
  loading = false,
}: OverviewCardProps) {
  const renderTrend = () => {
    if (trend === null || trend === undefined) return null;
    
    if (trend > 0) {
      return (
        <div className="flex items-center text-green-500">
          <ArrowUpIcon className="h-4 w-4 mr-1" />
          <span>{trend}%</span>
        </div>
      );
    } else if (trend < 0) {
      return (
        <div className="flex items-center text-red-500">
          <ArrowDownIcon className="h-4 w-4 mr-1" />
          <span>{Math.abs(trend)}%</span>
        </div>
      );
    }
    return <span className="text-gray-500">0%</span>;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
      <div className="flex items-baseline mt-2">
        <p className="text-3xl font-semibold text-gray-900">{value.toLocaleString()}</p>
        <div className="ml-2">{renderTrend()}</div>
      </div>
    </div>
  );
} 