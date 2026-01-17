import { NextResponse } from 'next/server';
import { sanitizeText, sanitizeUrl, truncateText } from '@/lib/sanitize';

interface Announcement {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
}

/**
 * Scrapes City of Lake Ozark announcements
 * Source: https://cityoflakeozark.net/
 */
export async function GET() {
  try {
    const response = await fetch('https://cityoflakeozark.net/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      next: { revalidate: 1800 }, // Cache for 30 minutes
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    const announcements: Announcement[] = [];

    // Parse HTML to extract announcements
    // Look for common patterns: headings, news items, announcements
    
    // Pattern 1: Look for headings with links (h1-h4)
    const headingPattern = /<h[1-4][^>]*>.*?<a[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
    let match;
    const seenUrls = new Set<string>();

    while ((match = headingPattern.exec(html)) !== null && announcements.length < 30) {
      const url = match[1].startsWith('http') ? match[1] : `https://cityoflakeozark.net${match[1]}`;
      const title = match[2].trim();
      
      if (title && !seenUrls.has(url) && title.length > 10) {
        seenUrls.add(url);
        
        // Try to find summary text
        let summary = '';
        const articleIndex = match.index;
        const nextMatch = headingPattern.lastIndex;
        const articleSection = html.substring(articleIndex, Math.min(articleIndex + 500, nextMatch));
        
        const summaryMatch = articleSection.match(/<p[^>]*>([^<]{50,200})/i);
        if (summaryMatch) {
          summary = summaryMatch[1].trim().replace(/\s+/g, ' ');
        } else {
          summary = title;
        }

        // Try to find date
        const dateMatch = html.substring(articleIndex, articleIndex + 1000).match(/(\d{1,2}\/\d{1,2}\/\d{4})|(\d{4}-\d{2}-\d{2})/);
        const publishedAt = dateMatch ? dateMatch[0] : new Date().toISOString();

        // Sanitize all content before adding
        const sanitizedUrl = sanitizeUrl(url);
        const sanitizedTitle = sanitizeText(title);
        const sanitizedSummary = truncateText(sanitizeText(summary), 200);
        
        announcements.push({
          id: `city-${sanitizedUrl.split('/').pop() || Date.now()}`,
          title: sanitizedTitle,
          summary: sanitizedSummary,
          url: sanitizedUrl,
          publishedAt,
        });
      }
    }

    // Pattern 2: Look for news/announcement sections
    if (announcements.length === 0) {
      const newsSection = html.match(/<section[^>]*class=["'][^"']*news[^"']*["'][^>]*>([\s\S]{0,5000})<\/section>/i);
      if (newsSection) {
        const newsHtml = newsSection[1];
        const linkPattern = /<a[^>]*href=["']([^"']+)["'][^>]*>([^<]{20,})<\/a>/gi;
        
        while ((match = linkPattern.exec(newsHtml)) !== null && announcements.length < 30) {
          const url = match[1].startsWith('http') ? match[1] : `https://cityoflakeozark.net${match[1]}`;
          const title = match[2].trim();
          
          if (title && !seenUrls.has(url) && title.length > 10) {
            seenUrls.add(url);
            // Sanitize all content before adding
            const sanitizedUrl = sanitizeUrl(url);
            const sanitizedTitle = sanitizeText(title);
            
            announcements.push({
              id: `city-${sanitizedUrl.split('/').pop() || Date.now()}`,
              title: sanitizedTitle,
              summary: sanitizedTitle,
              url: sanitizedUrl,
              publishedAt: new Date().toISOString(),
            });
          }
        }
      }
    }

    return NextResponse.json({ announcements });
  } catch (error) {
    // Log error in development only, don't expose details to client
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching City of Lake Ozark announcements:', error);
    }
    // Return empty array gracefully - don't expose error details
    return NextResponse.json({ announcements: [] }, { status: 200 });
  }
}

