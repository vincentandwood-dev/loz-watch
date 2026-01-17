/**
 * Weather Alerts Utility
 * Fetches active severe weather alerts from NOAA for Lake of the Ozarks area
 * Source: https://www.weather.gov/documentation/services-web-api
 */

// Lake of the Ozarks coordinates
const LAKE_COORDS = {
  lat: 38.1195,
  lng: -92.7714,
};

export interface WeatherAlert {
  id: string;
  event: string;
  severity: 'Minor' | 'Moderate' | 'Severe' | 'Extreme' | 'Unknown';
  headline: string;
  description: string;
  areaDesc: string;
  effective: string;
  expires: string;
}

export type AlertSeverity = 'warning' | 'watch' | 'advisory' | null;

/**
 * Determines the alert severity level from NOAA alert data
 */
function getAlertSeverity(event: string, severity: string): AlertSeverity {
  const eventLower = event.toLowerCase();
  const severityLower = severity.toLowerCase();

  // Warnings are the most severe
  if (eventLower.includes('warning') || severityLower === 'extreme' || severityLower === 'severe') {
    return 'warning';
  }

  // Watches are moderate
  if (eventLower.includes('watch') || severityLower === 'moderate') {
    return 'watch';
  }

  // Advisories are minor
  if (eventLower.includes('advisory') || severityLower === 'minor') {
    return 'advisory';
  }

  return null;
}

/**
 * Fetches active weather alerts for Lake of the Ozarks from NOAA API
 * @returns Promise<WeatherAlert[]> Array of active alerts
 */
export async function fetchWeatherAlerts(): Promise<WeatherAlert[]> {
  try {
    // NOAA Weather API endpoint for active alerts at a specific point
    const url = `https://api.weather.gov/alerts/active?point=${LAKE_COORDS.lat},${LAKE_COORDS.lng}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'loz.watch/1.0',
        'Accept': 'application/geo+json',
      },
    });

    if (!response.ok) {
      // Log error in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('NOAA API error:', response.status, response.statusText);
      }
      return [];
    }

    const data = await response.json();

    if (!data.features || !Array.isArray(data.features)) {
      return [];
    }

    // Filter and transform alerts
    const alerts: WeatherAlert[] = data.features
      .filter((feature: any) => {
        const properties = feature.properties;
        // Only include active alerts
        return properties && properties.status === 'Actual';
      })
      .map((feature: any) => {
        const props = feature.properties;
        return {
          id: props.id || '',
          event: props.event || 'Unknown',
          severity: props.severity || 'Unknown',
          headline: props.headline || props.event || 'Weather Alert',
          description: props.description || '',
          areaDesc: props.areaDesc || '',
          effective: props.effective || '',
          expires: props.expires || '',
        };
      });

    return alerts;
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching weather alerts:', error);
    }
    return [];
  }
}

/**
 * Gets the highest severity level from an array of alerts
 */
export function getHighestSeverity(alerts: WeatherAlert[]): AlertSeverity {
  if (alerts.length === 0) return null;

  let highestSeverity: AlertSeverity = null;

  for (const alert of alerts) {
    const severity = getAlertSeverity(alert.event, alert.severity);
    
    if (severity === 'warning') {
      return 'warning'; // Warning is highest, return immediately
    }
    
    if (severity === 'watch' && highestSeverity !== 'warning') {
      highestSeverity = 'watch';
    }
    
    if (severity === 'advisory' && !highestSeverity) {
      highestSeverity = 'advisory';
    }
  }

  return highestSeverity;
}

/**
 * Gets a short alert name for display
 */
export function getShortAlertName(alert: WeatherAlert): string {
  // Extract the main event type (e.g., "Severe Thunderstorm Warning" -> "Severe Thunderstorm")
  const event = alert.event;
  
  // Remove common suffixes
  const cleaned = event
    .replace(/\s+Warning$/i, '')
    .replace(/\s+Watch$/i, '')
    .replace(/\s+Advisory$/i, '');
  
  return cleaned || alert.event;
}

