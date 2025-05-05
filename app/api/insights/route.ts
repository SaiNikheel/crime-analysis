import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/config';
import { CrimeIncident, DashboardFilters, InsightSummary } from '@/lib/types';
import { generateInsights, analyzeIncident, generateSafetyTips } from '@/lib/gemini';

// Maximum number of incidents to process at once
const MAX_INCIDENTS_PER_CHUNK = 1000;

export async function POST(request: Request) {
  try {
    // Log the start of the request
    console.log('Insights API request started');

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

    // If the number of incidents is too large, process in chunks
    if (incidents.length > MAX_INCIDENTS_PER_CHUNK) {
      console.log(`Processing ${incidents.length} incidents in chunks of ${MAX_INCIDENTS_PER_CHUNK}`);
      
      // Create a TransformStream for streaming the response
      const stream = new TransformStream();
      const writer = stream.writable.getWriter();
      const encoder = new TextEncoder();

      // Start processing in the background
      (async () => {
        try {
          // Process incidents in chunks
          const chunks = [];
          for (let i = 0; i < incidents.length; i += MAX_INCIDENTS_PER_CHUNK) {
            const chunk = incidents.slice(i, i + MAX_INCIDENTS_PER_CHUNK);
            chunks.push(chunk);
          }

          // Process each chunk and combine results
          const allInsights = [];
          for (const chunk of chunks) {
            const chunkInsights = await generateInsights(chunk);
            allInsights.push(chunkInsights);
          }

          // Combine insights from all chunks
          const combinedInsights = combineInsights(allInsights);

          // Send the final response
          await writer.write(encoder.encode(JSON.stringify({ insights: combinedInsights })));
          await writer.close();
        } catch (error) {
          console.error('Error processing chunks:', error);
          await writer.write(encoder.encode(JSON.stringify({ 
            error: 'Error processing data chunks',
            details: error instanceof Error ? error.message : String(error)
          })));
          await writer.close();
        }
      })();

      // Return the streaming response
      return new Response(stream.readable, {
        headers: {
          'Content-Type': 'application/json',
          'Transfer-Encoding': 'chunked'
        }
      });
    }

    // For smaller datasets, process normally
    try {
      switch (type) {
        case 'overview':
          console.log('Generating overview insights...');
          const insights = await generateInsights(incidents);
          console.log('Insights generated successfully');
          return NextResponse.json({ insights });

        case 'incident':
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

// Helper function to combine insights from multiple chunks
function combineInsights(chunkInsights: any[][]): string[] {
  if (chunkInsights.length === 0) return [];
  
  // Initialize with the first chunk's insights
  const combined = [...chunkInsights[0]];
  
  // Merge subsequent chunks
  for (let i = 1; i < chunkInsights.length; i++) {
    const chunk = chunkInsights[i];
    for (let j = 0; j < chunk.length; j++) {
      if (j < combined.length) {
        // Merge insights for the same category
        combined[j] = mergeInsightCategory(combined[j], chunk[j]);
      } else {
        // Add new categories
        combined.push(chunk[j]);
      }
    }
  }
  
  return combined;
}

// Helper function to merge insights from the same category
function mergeInsightCategory(existing: string, newInsight: string): string {
  // Split into lines and remove duplicates
  const existingLines = existing.split('\n').filter(Boolean);
  const newLines = newInsight.split('\n').filter(Boolean);
  const mergedLines = [...new Set([...existingLines, ...newLines])];
  
  return mergedLines.join('\n');
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