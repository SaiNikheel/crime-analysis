import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CrimeIncident, DashboardFilters, InsightSummary } from '@/lib/types';
import { generateInsights, analyzeIncident, generateSafetyTips } from '@/lib/gemini';

// Add dynamic export to prevent caching
export const dynamic = 'force-dynamic';

// Maximum request size (in bytes)
const MAX_REQUEST_SIZE = 1024 * 1024; // 1MB

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    // Log the start of the request
    console.log('Insights API request started');

    // Check request size
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      console.error('Request too large:', contentLength, 'bytes');
      return NextResponse.json(
        { error: 'Request too large. Please reduce the number of incidents.' },
        { status: 413 }
      );
    }

    // Verify API key is set
    if (!process.env.GOOGLE_GEMINI_API_KEY) {
      console.error('GOOGLE_GEMINI_API_KEY is not set');
      return NextResponse.json(
        { error: 'Server configuration error: Gemini API key is not set' },
        { status: 500 }
      );
    }

    console.log('API Key is set, length:', process.env.GOOGLE_GEMINI_API_KEY.length);

    const { incidents, type, incidentId } = await request.json();
    console.log(`Request type: ${type}, Number of incidents: ${incidents?.length || 0}`);

    // Validate request
    if (!incidents || !Array.isArray(incidents)) {
      console.error('Invalid request: incidents array is missing or not an array');
      return NextResponse.json(
        { error: 'Invalid request: incidents array is required' },
        { status: 400 }
      );
    }

    // Prepare data for analysis by adding categories and extracting only essential fields
    const categorizedIncidents = incidents.map(incident => ({
      id: incident.id,
      newsType: incident.newsType,
      category: categorizeCrimeType(incident.newsType),
      location: incident.location,
      publishedDate: incident.publishedDate
    }));

    console.log('Processing request with type:', type);
    console.log('First few incidents:', categorizedIncidents.slice(0, 2));

    try {
      switch (type) {
        case 'overview':
          // Generate overall insights from all incidents
          console.log('Generating overview insights...');
          const insights = await generateInsights(categorizedIncidents);
          console.log('Insights generated successfully:', JSON.stringify(insights, null, 2));
          return NextResponse.json({ insights });

        case 'incident':
          // Analyze a specific incident
          if (!incidentId) {
            return NextResponse.json(
              { error: 'Invalid request: incidentId is required for incident analysis' },
              { status: 400 }
            );
          }
          const incident = incidents.find((inc: CrimeIncident) => inc.id === incidentId);
          if (!incident) {
            return NextResponse.json(
              { error: 'Incident not found' },
              { status: 404 }
            );
          }
          console.log('Analyzing specific incident:', incidentId);
          const analysis = await analyzeIncident(incident);
          return NextResponse.json({ analysis });

        case 'safety':
          // Generate safety tips for a news type
          if (!incidents[0]?.newsType) {
            return NextResponse.json(
              { error: 'Invalid request: newsType is required for safety tips' },
              { status: 400 }
            );
          }
          console.log('Generating safety tips for:', incidents[0].newsType);
          const tips = await generateSafetyTips(incidents[0].newsType);
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