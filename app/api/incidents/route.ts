import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { CrimeIncident } from '@/lib/types';

export async function GET(request: Request) {
  try {
    // Get filter parameters from URL
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const crimeType = searchParams.get('crimeType');

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

    // Transform data to include proper latitude and longitude
    let incidents = records.map((record: any, index: number) => {
      // Try to extract latitude and longitude from Common_Features_incident_location
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

      // Generate a random offset if no valid coordinates
      if (isNaN(latitude) || isNaN(longitude) || latitude === 0 || longitude === 0) {
        // Default to Telangana region with random offset
        latitude = 18.1124 + (Math.random() * 1.5 - 0.75);
        longitude = 79.0193 + (Math.random() * 1.5 - 0.75);
      }

      // Extract keywords from Common_Features_keywords
      const keywordsString = record.Common_Features_keywords || '';
      const keywords = keywordsString
        .split(';')
        .map((k: string) => k.trim())
        .filter((k: string) => k.length > 0);

      // Extract public reaction and references to past events
      const publicReaction = record.Common_Features_public_reaction || '';
      const pastEvents = record.Common_Features_references_to_past_events || '';
      const futureImplications = record.Common_Features_conclusion_and_future_implications || '';

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
        publicReaction,
        pastEvents,
        futureImplications,
        mainSubject: record.Common_Features_main_subject || '',
        dayOfWeek: record.Common_Features_day_of_week || '',
        imagesAndMedia: record.Common_Features_images_and_media || ''
      };
    }) as CrimeIncident[];

    // Apply filters
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      incidents = incidents.filter((incident: CrimeIncident) => {
        const date = new Date(incident.publishedDate);
        return date >= start && date <= end;
      });
    }

    if (crimeType && crimeType !== '') {
      incidents = incidents.filter((incident: CrimeIncident) => 
        incident.newsType.toLowerCase() === crimeType.toLowerCase()
      );
    }

    return NextResponse.json(incidents);
  } catch (error) {
    console.error('Error reading CSV:', error);
    return NextResponse.json(
      { error: 'Failed to load incidents data', details: String(error) },
      { status: 500 }
    );
  }
} 