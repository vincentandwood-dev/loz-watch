/**
 * Traffic Incidents Utility
 * Fetches and filters traffic incidents for Lake of the Ozarks area
 * Geographic scope: Camdenton, Eldon, Sunrise Beach, and major connecting routes
 */

export type IncidentType = 'accident' | 'closure' | 'construction' | 'disabled' | 'hazard' | 'other';

export type IncidentSeverity = 'info' | 'advisory' | 'alert';

export interface TrafficIncident {
  id: string;
  type: IncidentType;
  description: string;
  lat: number;
  lng: number;
  severity: IncidentSeverity;
  timestamp: string;
  source?: string;
}

// Geographic boundaries for Lake of the Ozarks area (expanded to include more surrounding areas)
// Includes: Camdenton, Eldon, Sunrise Beach, Versailles, and major routes (Hwy 54, Hwy 5, Bagnell Dam Blvd)
const LAKE_AREA_BOUNDS = {
  north: 38.50,  // Extended north to include Versailles, Morgan County
  south: 37.95,  // Extended south to include more of the lake area
  east: -92.50,  // Extended east
  west: -93.00,  // Extended west to include more of the region
};

/**
 * Checks if coordinates are within the Lake of the Ozarks area
 */
export function isWithinLakeArea(lat: number, lng: number): boolean {
  return (
    lat >= LAKE_AREA_BOUNDS.south &&
    lat <= LAKE_AREA_BOUNDS.north &&
    lng >= LAKE_AREA_BOUNDS.west &&
    lng <= LAKE_AREA_BOUNDS.east
  );
}

/**
 * Normalizes incident type from various sources
 */
function normalizeIncidentType(type: string): IncidentType {
  const typeLower = type.toLowerCase();
  
  if (typeLower.includes('accident') || typeLower.includes('crash') || typeLower.includes('collision')) {
    return 'accident';
  }
  if (typeLower.includes('closure') || typeLower.includes('closed') || typeLower.includes('blocked')) {
    return 'closure';
  }
  if (typeLower.includes('construction') || typeLower.includes('work') || typeLower.includes('maintenance')) {
    return 'construction';
  }
  if (typeLower.includes('disabled') || typeLower.includes('breakdown') || typeLower.includes('stalled')) {
    return 'disabled';
  }
  if (typeLower.includes('hazard') || typeLower.includes('debris') || typeLower.includes('obstruction')) {
    return 'hazard';
  }
  
  return 'other';
}

/**
 * Determines incident severity based on type and description
 */
function determineSeverity(type: IncidentType, description: string): IncidentSeverity {
  const descLower = description.toLowerCase();
  
  // Closures and accidents are alerts
  if (type === 'closure' || type === 'accident') {
    return 'alert';
  }
  
  // Construction and hazards are advisories
  if (type === 'construction' || type === 'hazard') {
    return 'advisory';
  }
  
  // Disabled vehicles and other are info
  return 'info';
}

/**
 * Fetches traffic incidents from OpenStreetMap Overpass API
 * Queries for construction, road closures, and hazards in the Lake of the Ozarks area
 * Source: https://wiki.openstreetmap.org/wiki/Overpass_API
 */
export async function fetchTrafficIncidents(): Promise<TrafficIncident[]> {
  try {
    // Build bounding box for Overpass query (south,west,north,east)
    const bbox = `${LAKE_AREA_BOUNDS.south},${LAKE_AREA_BOUNDS.west},${LAKE_AREA_BOUNDS.north},${LAKE_AREA_BOUNDS.east}`;
    
    // Overpass query for traffic-related incidents
    // Queries for: construction sites, road closures, barriers, and hazards
    const overpassQuery = `
      [out:json][timeout:25];
      (
        // Construction sites
        way["construction"](bbox:${bbox});
        way["highway"="construction"](bbox:${bbox});
        
        // Road closures and barriers
        way["highway"]["access"="no"](bbox:${bbox});
        way["barrier"](bbox:${bbox});
        way["highway"]["barrier"](bbox:${bbox});
        
        // Hazards
        way["hazard"](bbox:${bbox});
        way["natural"="hazard"](bbox:${bbox});
      );
      out center;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'loz.watch/1.0',
      },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    });

    if (!response.ok) {
      // Log error in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('Overpass API error:', response.status, response.statusText);
      }
      return [];
    }

    const data = await response.json();

    if (!data.elements || !Array.isArray(data.elements)) {
      return [];
    }

    // Transform OSM data to TrafficIncident format
    const incidents: TrafficIncident[] = data.elements
      .filter((element: any) => {
        // Only process ways (roads/paths) with center coordinates
        if (element.type !== 'way' || !element.center) {
          return false;
        }
        
        const lat = element.center.lat;
        const lng = element.center.lon;
        
        // Double-check geographic bounds
        return isWithinLakeArea(lat, lng);
      })
      .map((element: any) => {
        const tags = element.tags || {};
        const lat = element.center.lat;
        const lng = element.center.lon;
        
        // Determine incident type from OSM tags
        let incidentType: IncidentType = 'other';
        let description = 'Traffic incident';
        
        if (tags.construction || tags.highway === 'construction') {
          incidentType = 'construction';
          description = tags.construction 
            ? `Construction: ${tags.construction}`
            : tags.name || 'Road construction';
        } else if (tags.access === 'no' || tags.barrier) {
          incidentType = 'closure';
          description = tags.barrier 
            ? `Road closure: ${tags.barrier}`
            : tags.name || 'Road closed';
        } else if (tags.hazard || tags.natural === 'hazard') {
          incidentType = 'hazard';
          description = tags.hazard 
            ? `Hazard: ${tags.hazard}`
            : tags.name || 'Road hazard';
        } else {
          // Try to infer from name or other tags
          const name = tags.name || tags.ref || '';
          incidentType = normalizeIncidentType(name);
          description = name || 'Traffic incident';
        }
        
        // Use OSM element ID as unique identifier
        const id = `osm-${element.type}-${element.id}`;
        
        // Use last modified time if available, otherwise current time
        const timestamp = element.timestamp 
          ? new Date(element.timestamp).toISOString()
          : new Date().toISOString();
        
        return {
          id,
          type: incidentType,
          description,
          lat,
          lng,
          severity: determineSeverity(incidentType, description),
          timestamp,
          source: 'OpenStreetMap',
        };
      });

    return incidents;
    
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching traffic incidents from Overpass API:', error);
    }
    return [];
  }
}

/**
 * Gets the highest severity from an array of incidents
 */
export function getHighestIncidentSeverity(incidents: TrafficIncident[]): IncidentSeverity | null {
  if (incidents.length === 0) return null;
  
  const hasAlert = incidents.some(i => i.severity === 'alert');
  if (hasAlert) return 'alert';
  
  const hasAdvisory = incidents.some(i => i.severity === 'advisory');
  if (hasAdvisory) return 'advisory';
  
  return 'info';
}

/**
 * Formats incident type for display
 */
export function formatIncidentType(type: IncidentType): string {
  const labels: Record<IncidentType, string> = {
    accident: 'Accident',
    closure: 'Road Closure',
    construction: 'Construction',
    disabled: 'Disabled Vehicle',
    hazard: 'Hazard',
    other: 'Incident',
  };
  
  return labels[type];
}

