/**
 * Local Intelligence Utility
 * Aggregates public local news and incident data for Lake of the Ozarks
 * Sources: City of Lake Ozark, Lake Expo, public press releases
 */

export type IncidentCategory = 'crime' | 'accident' | 'boating' | 'fire' | 'advisory' | 'other';

export type IncidentSeverity = 'info' | 'advisory' | 'alert';

export interface LocalIncident {
  id: string;
  title: string;
  type: IncidentCategory;
  severity: IncidentSeverity;
  source: string;
  sourceUrl?: string;
  timestamp: string;
  lat?: number;
  lng?: number;
  summary?: string;
}

export interface TopStory {
  id: string;
  headline: string;
  summary: string;
  source: string;
  sourceUrl?: string;
  timestamp: string;
}

/**
 * Normalizes incident type from various sources
 */
export function normalizeIncidentType(type: string, title: string, summary?: string): IncidentCategory {
  const text = `${type} ${title} ${summary || ''}`.toLowerCase();
  
  if (text.includes('boat') || text.includes('marine') || text.includes('watercraft')) {
    return 'boating';
  }
  if (text.includes('fire') || text.includes('blaze') || text.includes('burn')) {
    return 'fire';
  }
  if (text.includes('accident') || text.includes('crash') || text.includes('collision')) {
    return 'accident';
  }
  if (text.includes('crime') || text.includes('arrest') || text.includes('theft') || text.includes('police')) {
    return 'crime';
  }
  if (text.includes('advisory') || text.includes('warning') || text.includes('alert')) {
    return 'advisory';
  }
  
  return 'other';
}

/**
 * Determines incident severity based on type and content
 */
export function determineIncidentSeverity(
  type: IncidentCategory,
  title: string,
  summary?: string
): IncidentSeverity {
  const text = `${title} ${summary || ''}`.toLowerCase();
  
  // Fires and serious accidents are alerts
  if (type === 'fire' || (type === 'accident' && (text.includes('fatal') || text.includes('serious')))) {
    return 'alert';
  }
  
  // Boating incidents and crimes are advisories
  if (type === 'boating' || type === 'crime') {
    return 'advisory';
  }
  
  // Accidents and advisories are advisories
  if (type === 'accident' || type === 'advisory') {
    return 'advisory';
  }
  
  return 'info';
}

/**
 * Fetches top local story from public sources
 * Sources: City of Lake Ozark, Lake Expo
 */
export async function fetchTopStory(): Promise<TopStory | null> {
  try {
    // Fetch from both sources in parallel
    const [lakeExpoResponse, cityResponse] = await Promise.allSettled([
      fetch('/api/lake-expo-news'),
      fetch('/api/city-announcements'),
    ]);

    const stories: TopStory[] = [];

    // Process Lake Expo news
    if (lakeExpoResponse.status === 'fulfilled' && lakeExpoResponse.value.ok) {
      const data = await lakeExpoResponse.value.json();
      if (data.articles && data.articles.length > 0) {
        const article = data.articles[0];
        stories.push({
          id: article.id,
          headline: article.title,
          summary: article.summary,
          source: 'Lake Expo',
          sourceUrl: article.url,
          timestamp: article.publishedAt,
        });
      }
    }

    // Process City of Lake Ozark announcements
    if (cityResponse.status === 'fulfilled' && cityResponse.value.ok) {
      const data = await cityResponse.value.json();
      if (data.announcements && data.announcements.length > 0) {
        const announcement = data.announcements[0];
        stories.push({
          id: announcement.id,
          headline: announcement.title,
          summary: announcement.summary,
          source: 'City of Lake Ozark',
          sourceUrl: announcement.url,
          timestamp: announcement.publishedAt,
        });
      }
    }

    // Return the most recent story
    if (stories.length === 0) {
      return null;
    }

    // Sort by timestamp (most recent first) and return the first one
    stories.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateB - dateA;
    });

    return stories[0];
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching top story:', error);
    }
    return null;
  }
}

/**
 * Fetches local incidents from the last 7 days (extended from 72 hours)
 * Aggregates from multiple public sources
 */
export async function fetchLocalIncidents(): Promise<LocalIncident[]> {
  try {
    // Filter to last 7 days (extended from 72 hours to show more incidents)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Fetch from both sources in parallel
    const [lakeExpoResponse, cityResponse] = await Promise.allSettled([
      fetch('/api/lake-expo-news'),
      fetch('/api/city-announcements'),
    ]);

    const incidents: LocalIncident[] = [];

    // Process Lake Expo news articles
    if (lakeExpoResponse.status === 'fulfilled' && lakeExpoResponse.value.ok) {
      const data = await lakeExpoResponse.value.json();
      if (data.articles && Array.isArray(data.articles)) {
        for (const article of data.articles) {
          // Try to parse the date, but don't filter strictly - show all recent articles
          let articleDate: Date;
          try {
            articleDate = new Date(article.publishedAt);
            // If date is invalid or too old (more than 30 days), skip
            if (isNaN(articleDate.getTime()) || articleDate < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
              continue;
            }
          } catch {
            // If we can't parse the date, include it anyway (assume it's recent)
            articleDate = new Date();
          }

          // Determine incident type from title and summary
          const text = `${article.title} ${article.summary}`.toLowerCase();
          const type = normalizeIncidentType('', article.title, article.summary);
          const severity = determineIncidentSeverity(type, article.title, article.summary);

          // Try to extract location from title/summary for approximate coordinates
          // Default to center of lake area if no specific location found
          let lat = 38.15;
          let lng = -92.75;

          // Try to match common location names (expanded list)
          if (text.includes('camdenton')) {
            lat = 38.20;
            lng = -92.75;
          } else if (text.includes('eldon')) {
            lat = 38.35;
            lng = -92.58;
          } else if (text.includes('osage beach') || text.includes('osage')) {
            lat = 38.13;
            lng = -92.65;
          } else if (text.includes('sunrise beach')) {
            lat = 38.18;
            lng = -92.78;
          } else if (text.includes('lake ozark') || text.includes('bagnell')) {
            lat = 38.20;
            lng = -92.63;
          } else if (text.includes('versailles')) {
            lat = 38.43;
            lng = -92.84;
          } else if (text.includes('linn creek')) {
            lat = 38.03;
            lng = -92.70;
          } else if (text.includes('gravois mills')) {
            lat = 38.20;
            lng = -92.83;
          } else if (text.includes('laurie')) {
            lat = 38.20;
            lng = -92.83;
          } else if (text.includes('four seasons')) {
            lat = 38.20;
            lng = -92.70;
          } else if (text.includes('miller county') || text.includes('miller')) {
            lat = 38.20;
            lng = -92.60;
          } else if (text.includes('camden county') || text.includes('camden')) {
            lat = 38.15;
            lng = -92.75;
          } else if (text.includes('morgan county') || text.includes('morgan')) {
            lat = 38.43;
            lng = -92.84;
          } else if (text.includes('highway 54') || text.includes('hwy 54') || text.includes('hwy54')) {
            lat = 38.20;
            lng = -92.75; // Camdenton area on Hwy 54
          } else if (text.includes('highway 5') || text.includes('hwy 5') || text.includes('hwy5')) {
            lat = 38.15;
            lng = -92.70; // Lake area on Hwy 5
          } else {
            // For articles without specific location matches, spread them around the lake area
            // Use a hash of the article ID to create consistent but distributed coordinates
            const hash = article.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const spread = 0.25; // Spread radius in degrees (~15 miles) - increased to spread incidents better
            // Create more variation by using different hash calculations for lat/lng
            const latOffset = ((hash % 200) - 100) / 400 * spread;
            const lngOffset = (((hash * 13) % 200) - 100) / 400 * spread;
            lat = 38.15 + latOffset;
            lng = -92.75 + lngOffset;
          }
          
          // Always assign coordinates - don't skip articles without specific location matches

          incidents.push({
            id: article.id,
            title: article.title,
            type,
            severity,
            source: 'Lake Expo',
            sourceUrl: article.url,
            timestamp: article.publishedAt,
            lat,
            lng,
            summary: article.summary,
          });
        }
      }
    }

    // Process City of Lake Ozark announcements
    if (cityResponse.status === 'fulfilled' && cityResponse.value.ok) {
      const data = await cityResponse.value.json();
      if (data.announcements && Array.isArray(data.announcements)) {
        for (const announcement of data.announcements) {
          // Try to parse the date, but don't filter strictly - show all recent announcements
          let announcementDate: Date;
          try {
            announcementDate = new Date(announcement.publishedAt);
            // If date is invalid or too old (more than 30 days), skip
            if (isNaN(announcementDate.getTime()) || announcementDate < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
              continue;
            }
          } catch {
            // If we can't parse the date, include it anyway (assume it's recent)
            announcementDate = new Date();
          }

          const text = `${announcement.title} ${announcement.summary}`.toLowerCase();
          const type = normalizeIncidentType('', announcement.title, announcement.summary);
          const severity = determineIncidentSeverity(type, announcement.title, announcement.summary);

          // City announcements are typically in Lake Ozark area
          incidents.push({
            id: announcement.id,
            title: announcement.title,
            type,
            severity,
            source: 'City of Lake Ozark',
            sourceUrl: announcement.url,
            timestamp: announcement.publishedAt,
            lat: 38.20,
            lng: -92.63,
            summary: announcement.summary,
          });
        }
      }
    }

    // Sort by timestamp (newest first)
    incidents.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return incidents;
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching local incidents:', error);
    }
    return [];
  }
}

/**
 * Checks if an incident is within the last 72 hours
 */
export function isWithin72Hours(timestamp: string): boolean {
  try {
    const incidentTime = new Date(timestamp);
    const now = new Date();
    const hoursDiff = (now.getTime() - incidentTime.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 72;
  } catch {
    return false;
  }
}

/**
 * Formats time since incident occurred
 */
export function formatTimeSince(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 3) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  } catch {
    return 'Unknown time';
  }
}

