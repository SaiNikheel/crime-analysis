'use client';

import { motion } from 'framer-motion';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';

interface OverviewCardProps {
  title: string;
  value: number;
  trend?: number;
  loading?: boolean;
}

export default function OverviewCard({
  title,
  value,
  trend,
  loading = false,
}: OverviewCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow p-6"
    >
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      
      {loading ? (
        <div className="animate-pulse mt-2">
          <div className="h-8 bg-gray-200 rounded w-24"></div>
        </div>
      ) : (
        <>
          <div className="mt-2 flex items-baseline">
            <p className="text-3xl font-semibold text-gray-900">
              {value.toLocaleString()}
            </p>
            {trend !== undefined && (
              <p
                className={`ml-2 flex items-baseline text-sm font-semibold ${
                  trend >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend >= 0 ? (
                  <ArrowUpIcon className="h-4 w-4 flex-shrink-0 self-center text-green-500" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 flex-shrink-0 self-center text-red-500" />
                )}
                <span className="sr-only">
                  {trend >= 0 ? 'Increased' : 'Decreased'} by
                </span>
                {Math.abs(trend)}%
              </p>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
} 