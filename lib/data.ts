import { promises as fs } from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { CrimeIncident, DashboardFilters } from '@/lib/types';

// Cache for the incidents data to avoid reading the large CSV file repeatedly
let cachedIncidents: CrimeIncident[] | null = null;
let cacheTimestamp: number | null = null;
const CACHE_DURATION_MS = 60 * 60 * 1000; // Cache for 1 hour

async function loadAndParseIncidents(): Promise<CrimeIncident[]> {
  // Read the CSV file
  const csvPath = path.join(process.cwd(), 'MERGED_FILE.csv');
  const fileContent = await fs.readFile(csvPath, 'utf-8');
  
  // Parse CSV data
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    quote: '"',
    escape: '"',
    relax_column_count: true
  });

  // Transform data
  return records.map((record: any, index: number) => {
    let latitude = 0;
    let longitude = 0;
    
    try {
      if (record.Common_Features_incident_location) {
        const coordString = record.Common_Features_incident_location.replace(/"/g, '').trim();
        const coords = coordString.split(',');
        if (coords.length === 2) {
          latitude = parseFloat(coords[0].trim());
          longitude = parseFloat(coords[1].trim());
        }
      }
    } catch (error) {
      console.warn(`Error parsing coordinates for record ${index}:`, error);
    }

    if (isNaN(latitude) || isNaN(longitude) || latitude === 0 || longitude === 0) {
      latitude = 18.1124 + (Math.random() * 1.5 - 0.75);
      longitude = 79.0193 + (Math.random() * 1.5 - 0.75);
    }

    const keywordsString = record.Common_Features_keywords || '';
    const keywords = keywordsString
      .split(';')
      .map((k: string) => k.trim())
      .filter((k: string) => k.length > 0);

    return {
      id: record.Source_file || `incident-${index}`,
      title: record.Common_Features_headline || 'No Title',
      description: record.Common_Features_summary || 'No Description',
      publishedDate: record.Published_Date || new Date().toISOString(),
      latitude,
      longitude,
      newsType: record.News_Type || 'Unknown',
      involvedPersonsRole: record.Involved_persons_role || 'Unknown',
      location: record.Common_Features_incident_location_place?.replace(/"/g, '') || 'Unknown Location',
      keywords,
      impact: record.Common_Features_impact_and_significance || '',
      source: record.Common_Features_source || '',
      date_time: record.Common_Features_date_time || '',
      tone: record.Common_Features_tone_of_news || '',
      quotes: record.Common_Features_quotes_and_statements || '',
      publicReaction: record.Common_Features_public_reaction || '',
      pastEvents: record.Common_Features_references_to_past_events || '',
      futureImplications: record.Common_Features_conclusion_and_future_implications || '',
      mainSubject: record.Common_Features_main_subject || '',
      dayOfWeek: record.Common_Features_day_of_week || '',
      imagesAndMedia: record.Common_Features_images_and_media || ''
    };
  }) as CrimeIncident[];
}

/**
 * Retrieves crime incidents, optionally applying filters.
 * Implements in-memory caching to reduce file reads.
 * @param filters Optional filters for startDate, endDate, and crimeType.
 * @returns A promise resolving to an array of filtered CrimeIncidents.
 */
export async function getFilteredIncidents(filters?: DashboardFilters): Promise<CrimeIncident[]> {
  const now = Date.now();

  // Check cache validity
  if (!cachedIncidents || !cacheTimestamp || (now - cacheTimestamp > CACHE_DURATION_MS)) {
    console.log('Cache miss or expired. Loading incidents from CSV...');
    try {
      cachedIncidents = await loadAndParseIncidents();
      cacheTimestamp = now;
      console.log(`Loaded and cached ${cachedIncidents.length} incidents.`);
    } catch (error) {
      console.error('Failed to load incidents from CSV:', error);
      // Return empty array or throw error depending on desired behavior
      return []; 
    }
  } else {
    console.log('Using cached incidents.');
  }

  let incidentsToFilter = cachedIncidents || [];

  // Apply filters if provided
  if (filters) {
    // Use dateRange from the filters object
    const { dateRange, crimeType } = filters;

    // Check if dateRange is valid
    if (dateRange && Array.isArray(dateRange) && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
      const start = new Date(dateRange[0]);
      const end = new Date(dateRange[1]);
      // Make sure end date includes the whole day
      end.setHours(23, 59, 59, 999); 
      
      incidentsToFilter = incidentsToFilter.filter((incident) => {
         try {
           const date = new Date(incident.publishedDate);
           // Check if date is valid before comparison
           return !isNaN(date.getTime()) && date >= start && date <= end;
         } catch (e) {
           console.warn(`Invalid date format for incident ${incident.id}: ${incident.publishedDate}`);
           return false;
         }
      });
    }

    if (crimeType && crimeType !== '') {
      incidentsToFilter = incidentsToFilter.filter((incident) => 
        incident.newsType?.toLowerCase() === crimeType.toLowerCase()
      );
    }
  }

  return incidentsToFilter;
} 