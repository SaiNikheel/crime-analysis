import { NextResponse } from 'next/server';
import { CrimeIncident, DashboardFilters } from '@/lib/types';
import { getFilteredIncidents } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Get filter parameters from URL
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const crimeType = searchParams.get('crimeType');

    // Construct filters object (handle potential null values)
    const filters: Partial<DashboardFilters> = {};
    if (startDate && endDate) {
      try {
        filters.dateRange = [new Date(startDate), new Date(endDate)];
      } catch (e) {
        console.warn('Invalid date format in query params');
      }
    }

    if (crimeType && crimeType !== '') {
      filters.crimeType = crimeType;
    }

    // Get incidents using the centralized function
    const incidents = await getFilteredIncidents(filters as DashboardFilters);

    return NextResponse.json(incidents);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json(
      { error: 'Failed to load incidents data', details: String(error) },
      { status: 500 }
    );
  }
} 