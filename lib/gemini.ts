import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API with your API key
const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
if (!apiKey) {
  console.error('GOOGLE_GEMINI_API_KEY is not set in environment variables');
  throw new Error('GOOGLE_GEMINI_API_KEY is not set in environment variables');
}

console.log('Initializing Gemini API with key:', apiKey.substring(0, 5) + '...');
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Maximum number of incidents to process at once
const MAX_INCIDENTS_PER_REQUEST = 1000;

async function handleGeminiError(error: any) {
  console.error('Gemini API Error Details:', {
    message: error.message,
    name: error.name,
    stack: error.stack,
    response: error.response
  });
  
  if (error.message?.includes('models/gemini-2.0-flash is not found')) {
    throw new Error(
      'The Gemini API is not enabled for this project. Please enable it in the Google Cloud Console: ' +
      'Go to console.cloud.google.com > APIs & Services > Library > Search for "Gemini API" > Enable'
    );
  }
  
  if (error.message?.includes('API key not valid')) {
    throw new Error(
      'The provided Gemini API key is not valid. Please check your API key in the Google Cloud Console.'
    );
  }
  
  throw error;
}

export async function generateInsights(data: any) {
  try {
    console.log('Starting generateInsights with data length:', data.length);
    
    // If data is too large, sample it
    let processedData = data;
    if (data.length > MAX_INCIDENTS_PER_REQUEST) {
      console.log(`Data too large (${data.length} incidents), sampling to ${MAX_INCIDENTS_PER_REQUEST} incidents`);
      // Take a random sample of incidents
      processedData = data
        .sort(() => Math.random() - 0.5)
        .slice(0, MAX_INCIDENTS_PER_REQUEST);
    }

    // Prepare data for the prompt by extracting key information
    const summary = {
      totalIncidents: data.length,
      sampledIncidents: processedData.length,
      categories: {} as Record<string, number>,
      locations: {} as Record<string, number>,
      timeRange: {
        start: '',
        end: ''
      }
    };

    // Calculate statistics
    processedData.forEach((incident: any) => {
      // Count by category
      summary.categories[incident.category] = (summary.categories[incident.category] || 0) + 1;
      
      // Count by location
      if (incident.location) {
        summary.locations[incident.location] = (summary.locations[incident.location] || 0) + 1;
      }
      
      // Track time range
      const date = new Date(incident.publishedDate);
      if (!summary.timeRange.start || date < new Date(summary.timeRange.start)) {
        summary.timeRange.start = incident.publishedDate;
      }
      if (!summary.timeRange.end || date > new Date(summary.timeRange.end)) {
        summary.timeRange.end = incident.publishedDate;
      }
    });

    const prompt = `
    You are analyzing data extracted from newspaper reports to provide valuable insights to government officials, IAS officers, and police departments. This data has already been collected and processed - your task is to analyze it and provide actionable insights, not to recommend changes to the data collection process.

    Data Summary:
    - Total Incidents: ${summary.totalIncidents} (Analyzing ${summary.sampledIncidents} incidents)
    - Time Range: ${summary.timeRange.start} to ${summary.timeRange.end}
    - Categories: ${Object.entries(summary.categories)
      .map(([cat, count]) => `${cat}: ${count} (${Math.round(count/summary.sampledIncidents*100)}%)`)
      .join(', ')}
    - Top Locations: ${Object.entries(summary.locations)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([loc, count]) => `${loc}: ${count}`)
      .join(', ')}

    Generate insights in the following EXACT format (this is very important):

    {
      "keyPatterns": [
        "Clear, direct statement about the most significant trend or pattern",
        "Second most important pattern or trend observation",
        "Third key pattern that officials should be aware of"
      ],
      "riskAreas": [
        "Most critical risk area requiring immediate attention",
        "Second priority risk area or emerging concern",
        "Third significant risk that needs monitoring"
      ],
      "recommendations": [
        "Direct, actionable step that officials can take immediately",
        "Second priority action item for implementation",
        "Third recommended action for addressing identified issues"
      ],
      "communityImpact": [
        "Primary way these incidents affect the community",
        "Secondary community impact or concern",
        "Third most significant effect on community well-being"
      ]
    }

    Guidelines for each insight:
    - Start with the most important information
    - Use clear, direct language
    - Keep each point to 10-15 words maximum
    - Focus on actionable information
    - Avoid using phrases like "need to" or "should be"
    - Make each point stand alone (don't use "also" or reference other points)

    Important Notes:
    - Focus on insights officials can act on immediately
    - Base all insights strictly on the provided data
    - Don't suggest changes to data collection or reporting
    - Avoid general or vague statements
    
    Make sure to only output the JSON format above with no additional text or markdown.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    try {
      // Try to parse the response as JSON
      const jsonResponse = JSON.parse(text);
      
      // Return the insights in the expected format
      return [
        jsonResponse.keyPatterns.join('\n'),
        jsonResponse.riskAreas.join('\n'),
        jsonResponse.recommendations.join('\n'),
        jsonResponse.communityImpact.join('\n')
      ];
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      
      // Fallback to regex-based parsing if JSON parsing fails
      const sections = [
        'keyPatterns',
        'riskAreas',
        'recommendations',
        'communityImpact'
      ];
      
      const extractedSections: string[] = [];
      
      for (const section of sections) {
        const regex = new RegExp(`"${section}":\\s*\\[(.*?)\\]`, 's');
        const match = text.match(regex);
        
        if (match && match[1]) {
          const points = match[1]
            .split(',')
            .map(item => item.trim().replace(/^"|"$/g, '').trim())
            .filter(item => item.length > 0)
            .join('\n');
          
          extractedSections.push(points);
        } else {
          extractedSections.push('No insights available for this section');
        }
      }
      
      return extractedSections;
    }
  } catch (error) {
    return handleGeminiError(error);
  }
}

export async function analyzeIncident(incident: any) {
  try {
    const prompt = `
    As a law enforcement analyst, analyze this specific incident and provide insights:

    Incident Details:
    - Type: ${incident.newsType} (Category: ${incident.category})
    - Location: ${incident.location}
    - Date: ${incident.publishedDate}
    - Description: ${incident.description}
    ${incident.keywords ? `- Keywords: ${incident.keywords.join(', ')}` : ''}
    ${incident.impact ? `- Impact: ${incident.impact}` : ''}

    Please provide:
    1. Risk Assessment
    2. Similar Pattern Recognition
    3. Recommended Actions
    4. Community Impact
    
    Keep the analysis concise and actionable.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    return handleGeminiError(error);
  }
}

export async function generateSafetyTips(newsType: string) {
  try {
    const prompt = `
    As a public safety expert, provide specific safety tips and preventive measures for the following type of incident:
    ${newsType}

    Focus on:
    1. Prevention strategies
    2. Early warning signs
    3. Community response
    4. Reporting procedures

    Keep tips practical and actionable for the general public.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    return handleGeminiError(error);
  }
} 