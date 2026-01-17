import { NextResponse } from 'next/server';
import { sanitizeText, sanitizeUrl, truncateText } from '@/lib/sanitize';

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
}

/**
 * Scrapes Lake Expo news articles from crime and community news sections
 * Sources: 
 * - https://www.lakeexpo.com/news/crime
 * - https://www.lakeexpo.com/community/community_news
 */
export async function GET() {
  try {
    // Fetch from both crime and community news sections
    const [crimeResponse, communityResponse] = await Promise.allSettled([
      fetch('https://www.lakeexpo.com/news/crime', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        next: { revalidate: 1800 }, // Cache for 30 minutes
      }),
      fetch('https://www.lakeexpo.com/community/community_news', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        next: { revalidate: 1800 }, // Cache for 30 minutes
      }),
    ]);

    const articles: NewsArticle[] = [];
    const seenUrls = new Set<string>();

    // Process crime news
    if (crimeResponse.status === 'fulfilled' && crimeResponse.value.ok) {
      const html = await crimeResponse.value.text();
      const crimeArticles = parseArticles(html);
      crimeArticles.forEach(article => {
        if (!seenUrls.has(article.url)) {
          seenUrls.add(article.url);
          articles.push(article);
        }
      });
    }

    // Process community news
    if (communityResponse.status === 'fulfilled' && communityResponse.value.ok) {
      const html = await communityResponse.value.text();
      const communityArticles = parseArticles(html);
      communityArticles.forEach(article => {
        if (!seenUrls.has(article.url)) {
          seenUrls.add(article.url);
          articles.push(article);
        }
      });
    }

    // Sort by published date (newest first) and limit to 50 (increased from 10)
    articles.sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({ articles: articles.slice(0, 50) });
  } catch (error) {
    // Log error in development only, don't expose details to client
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching Lake Expo news:', error);
    }
    // Return empty array gracefully - don't expose error details
    return NextResponse.json({ articles: [] }, { status: 200 });
  }
}

/**
 * Parses articles from Lake Expo HTML
 */
function parseArticles(html: string): NewsArticle[] {
  const articles: NewsArticle[] = [];
  const seenUrls = new Set<string>();

  // Pattern 1: Look for article titles in h2/h3/h4 tags with links
  const titlePattern = /<h[2-4][^>]*>.*?<a[^>]*href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
  let match;

  while ((match = titlePattern.exec(html)) !== null && articles.length < 50) {
    const url = match[1].startsWith('http') ? match[1] : `https://www.lakeexpo.com${match[1]}`;
    const title = match[2].trim();
    
    if (title && !seenUrls.has(url) && title.length > 10) {
      seenUrls.add(url);
      
      // Try to find a summary/excerpt near this article
      let summary = '';
      const articleIndex = match.index;
      const nextMatch = titlePattern.lastIndex;
      const articleSection = html.substring(articleIndex, Math.min(articleIndex + 500, nextMatch || html.length));
      
      // Look for paragraph text after the title
      const summaryMatch = articleSection.match(/<p[^>]*>([^<]{50,200})/i);
      if (summaryMatch) {
        summary = summaryMatch[1].trim().replace(/\s+/g, ' ');
      } else {
        summary = title; // Use title as summary if no excerpt found
      }

      // Try to find published date
      const dateMatch = html.substring(articleIndex, articleIndex + 1000).match(/(\d{1,2}\/\d{1,2}\/\d{4})|(\d{4}-\d{2}-\d{2})/);
      const publishedAt = dateMatch ? dateMatch[0] : new Date().toISOString();

      // Sanitize all content before adding
      const sanitizedUrl = sanitizeUrl(url);
      const sanitizedTitle = sanitizeText(title);
      const sanitizedSummary = truncateText(sanitizeText(summary), 200);
      
      articles.push({
        id: `lakeexpo-${sanitizedUrl.split('/').pop() || Date.now()}`,
        title: sanitizedTitle,
        summary: sanitizedSummary,
        url: sanitizedUrl,
        publishedAt,
      });
    }
  }

  // Pattern 2: Look for article links in list items or divs if pattern 1 didn't find enough
  if (articles.length < 5) {
    const altPattern = /<a[^>]*href=["'](\/(?:news|community)\/[^"']+)["'][^>]*>([^<]{20,})<\/a>/gi;
    while ((match = altPattern.exec(html)) !== null && articles.length < 50) {
      const url = `https://www.lakeexpo.com${match[1]}`;
      const title = match[2].trim();
      
      if (title && !seenUrls.has(url) && title.length > 10) {
        seenUrls.add(url);
        // Sanitize all content before adding
        const sanitizedUrl = sanitizeUrl(url);
        const sanitizedTitle = sanitizeText(title);
        
        articles.push({
          id: `lakeexpo-${sanitizedUrl.split('/').pop() || Date.now()}`,
          title: sanitizedTitle,
          summary: sanitizedTitle,
          url: sanitizedUrl,
          publishedAt: new Date().toISOString(),
        });
      }
    }
  }

  return articles;
}
