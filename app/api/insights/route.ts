import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/config';
import { CrimeIncident, DashboardFilters, InsightSummary } from '@/lib/types';
import { generateInsights, analyzeIncident, generateSafetyTips } from '@/lib/gemini';
import { getFilteredIncidents } from '@/lib/data';

export async function POST(request: Request) {
  try {
    // Log the start of the request
    console.log('Insights API request started');

    // Expect filters, type, and optional incidentId in the request body
    const { filters, type, incidentId } = await request.json(); 

    // Validate request type
    if (!type) {
      return NextResponse.json({ error: 'Request type is required' }, { status: 400 });
    }

    console.log(`Processing request type: ${type}`);

    // Fetch incidents based on filters (only if needed by the type)
    let incidents: CrimeIncident[] = [];
    if (type === 'overview' || type === 'incident') { 
        if (!filters) {
            console.error('Invalid request: filters object is required for this type');
            return NextResponse.json(
              { error: 'Invalid request: filters object is required' },
              { status: 400 }
            );
        }
        incidents = await getFilteredIncidents(filters);
        console.log(`Fetched ${incidents.length} incidents based on filters.`);
    } else if (type === 'safety') {
        // Safety tips might need the newsType from the first incident if filters are provided
        // Or potentially accept newsType directly in the request body
        // For simplicity, let's assume filters are passed and we use the first incident
        if (filters) {
            incidents = await getFilteredIncidents(filters);
            if (incidents.length === 0) {
                return NextResponse.json({ error: 'No incidents found for the provided filters to determine safety tips context.' }, { status: 404 });
            }
        } else {
            // Modification: Allow passing newsType directly for safety tips
            const { newsType } = await request.json(); // Re-parse or adjust initial parse
             if (!newsType) {
                 return NextResponse.json({ error: 'Filters or newsType required for safety tips.' }, { status: 400 });
             }
             // We don't need the full incident list here if newsType is provided directly
        }
    }

    // Prepare data for analysis by adding categories (only if incidents were fetched)
    let categorizedIncidents: CrimeIncident[] = [];
    if (incidents.length > 0) {
        categorizedIncidents = incidents.map(incident => ({
            ...incident,
            category: categorizeCrimeType(incident.newsType)
        }));
    }

    try {
      switch (type) {
        case 'overview':
          // Generate overall insights from all incidents
          console.log('Generating overview insights...');
          if (categorizedIncidents.length === 0) {
              return NextResponse.json({ insights: [] }); // Return empty if no incidents match filters
          }
          const insights = await generateInsights(categorizedIncidents);
          console.log('Insights generated successfully');
          return NextResponse.json({ insights });

        case 'incident':
          // Analyze a specific incident
          if (!incidentId) {
            return NextResponse.json(
              { error: 'Invalid request: incidentId is required for incident analysis' },
              { status: 400 }
            );
          }
          // Find the incident within the ALREADY filtered list
          const incident = categorizedIncidents.find((inc: CrimeIncident) => inc.id === incidentId);
          if (!incident) {
            return NextResponse.json(
              { error: 'Incident not found within the filtered results' }, 
              { status: 404 }
            );
          }
          console.log('Analyzing specific incident:', incidentId);
          const analysis = await analyzeIncident(incident);
          return NextResponse.json({ analysis });

        case 'safety':
          // Option 1: Use newsType from first filtered incident
          // Option 2: Expect newsType directly in request body
          const { newsType: safetyNewsType } = await request.json(); // Re-parse or adjust initial parse

          let typeForSafety = safetyNewsType;
          if (!typeForSafety && incidents.length > 0) {
             typeForSafety = incidents[0]?.newsType;
          }

          // Generate safety tips for a news type
          if (!typeForSafety) {
            return NextResponse.json(
              { error: 'Invalid request: newsType is required for safety tips' },
              { status: 400 }
            );
          }
          console.log('Generating safety tips for:', typeForSafety);
          const tips = await generateSafetyTips(typeForSafety);
          return NextResponse.json({ tips });

        default:
          console.error('Invalid request type:', type);
          return NextResponse.json(
            { error: 'Invalid request type' },
            { status: 400 }
          );
      }
    } catch (error) {
      console.error('Error in Gemini API call:', error);
      return NextResponse.json(
        { 
          error: 'Error processing request with Gemini API',
          details: error instanceof Error ? error.message : String(error)
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in insights API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Helper function to categorize news types
function categorizeCrimeType(type: string): string {
  const typeClean = (type || '').toLowerCase().trim();
  
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