import { NextResponse } from 'next/server';

interface LakeStatus {
  lakeLevel: number | null;
  waterTemp: number | null;
  riverLevel: number | null;
  lastUpdated: string;
  error?: string;
}

/**
 * Fetches lake level and temperature data from Ameren's Lake of the Ozarks reports page
 * Source: https://www.ameren.com/property/lake-of-the-ozarks/reports
 */
export async function GET() {
  try {
    const response = await fetch('https://www.ameren.com/property/lake-of-the-ozarks/reports', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    
    // Parse the HTML to extract lake level and temperature
    // The data appears in a table format on the page
    // Patterns to match: "Current Lake level is | 656.1" or similar variations
    const lakeLevelPatterns = [
      /Current\s+Lake\s+level\s+is\s*[|:]\s*(\d+\.?\d*)/i,
      /Lake\s+level[^|]*[|:]\s*(\d+\.?\d*)/i,
      /Current\s+Lake\s+level[^0-9]*(\d+\.?\d*)/i,
    ];
    
    const waterTempPatterns = [
      /Surface\s+Water\s+Temp\s+is\s*[|:]\s*(\d+\.?\d*)/i,
      /Surface\s+Water\s+Temp[^|]*[|:]\s*(\d+\.?\d*)/i,
      /Water\s+Temp[^0-9]*(\d+\.?\d*)/i,
    ];
    
    const riverLevelPatterns = [
      /River\s+Level\s+is\s*[|:]\s*(\d+\.?\d*)/i,
      /River\s+Level[^|]*[|:]\s*(\d+\.?\d*)/i,
    ];

    // Try each pattern until we find a match
    let lakeLevel: number | null = null;
    for (const pattern of lakeLevelPatterns) {
      const match = html.match(pattern);
      if (match) {
        lakeLevel = parseFloat(match[1]);
        break;
      }
    }

    let waterTemp: number | null = null;
    for (const pattern of waterTempPatterns) {
      const match = html.match(pattern);
      if (match) {
        waterTemp = parseFloat(match[1]);
        break;
      }
    }

    let riverLevel: number | null = null;
    for (const pattern of riverLevelPatterns) {
      const match = html.match(pattern);
      if (match) {
        riverLevel = parseFloat(match[1]);
        break;
      }
    }

    const status: LakeStatus = {
      lakeLevel,
      waterTemp,
      riverLevel,
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json(status);
  } catch (error) {
    // Log error in development only, don't expose details to client
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching lake status:', error);
    }
    
    // Return error response but don't fail completely
    // Don't expose internal error details
    return NextResponse.json(
      {
        lakeLevel: null,
        waterTemp: null,
        riverLevel: null,
        lastUpdated: new Date().toISOString(),
        error: 'Unable to fetch lake status data',
      },
      { status: 200 } // Return 200 so UI can handle gracefully
    );
  }
}

