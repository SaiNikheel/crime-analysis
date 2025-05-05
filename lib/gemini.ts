import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API with your API key
const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GOOGLE_GEMINI_API_KEY is not set in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

async function handleGeminiError(error: any) {
  console.error('Gemini API Error:', error);
  
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
    // Prepare data for the prompt by extracting key information
    const summary = {
      totalIncidents: data.length,
      categories: {} as Record<string, number>,
      locations: {} as Record<string, number>,
      timeRange: {
        start: '',
        end: ''
      }
    };

    // Calculate statistics
    data.forEach((incident: any) => {
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
    - Total Incidents: ${summary.totalIncidents}
    - Time Range: ${summary.timeRange.start} to ${summary.timeRange.end}
    - Categories: ${Object.entries(summary.categories)
      .map(([cat, count]) => `${cat}: ${count} (${Math.round(count/summary.totalIncidents*100)}%)`)
      .join(', ')}
    - Top Locations: ${Object.entries(summary.locations)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([loc, count]) => `${loc}: ${count}`)
      .join(', ')}

    Generate insights in the following EXACT format (this is very important):

    {
      "keyPatterns": [
        "-> [5-7 word observation] [specific data point]",
        "-> [5-7 word observation] [specific data point]",
        "-> [5-7 word observation] [specific data point]"
      ],
      "riskAreas": [
        "-> [location/area] [specific risk] [data evidence]",
        "-> [location/area] [specific risk] [data evidence]",
        "-> [location/area] [specific risk] [data evidence]"
      ],
      "recommendations": [
        "-> [specific action] [target area/group] [expected impact]",
        "-> [specific action] [target area/group] [expected impact]",
        "-> [specific action] [target area/group] [expected impact]"
      ],
      "communityImpact": [
        "-> [specific impact] [affected group] [data evidence]",
        "-> [specific impact] [affected group] [data evidence]",
        "-> [specific impact] [affected group] [data evidence]"
      ]
    }

    Guidelines for each insight:
    - Start each point with "->"
    - Keep each point under 15 words
    - Include specific data points or numbers
    - Focus on patterns visible in the data
    - Avoid general statements without data support
    - Do not suggest data collection improvements
    - Do not use phrases like "need to" or "should be"
    - Make each point stand alone (no references to other points)

    Important Notes:
    - Base all insights strictly on the provided data
    - Focus on patterns and trends visible in the data
    - Include specific numbers or percentages where available
    - Avoid general or vague statements
    - Do not suggest changes to data collection or reporting
    
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