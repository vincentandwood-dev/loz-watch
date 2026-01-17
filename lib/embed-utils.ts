/**
 * Utility functions for processing embed URLs
 * Handles Twitch, YouTube, and other embed formats
 */

/**
 * Converts a Twitch URL to a proper embed URL with parent parameter
 * Supports channel, video, and clip URLs
 */
function processTwitchUrl(url: string): string {
  // Get the current hostname for the parent parameter
  // Twitch requires the parent parameter to match the domain where the embed is hosted
  const parent = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  
  try {
    // If it's already a Twitch embed URL, just add/update the parent parameter
    if (url.includes('player.twitch.tv') || url.includes('clips.twitch.tv/embed')) {
      const urlObj = new URL(url);
      urlObj.searchParams.set('parent', parent);
      // Ensure muted is set to false for live streams
      if (url.includes('player.twitch.tv')) {
        urlObj.searchParams.set('muted', 'false');
      }
      return urlObj.toString();
    }
    
    // Twitch video URL: https://www.twitch.tv/videos/VIDEO_ID
    const videoMatch = url.match(/twitch\.tv\/videos\/(\d+)/);
    if (videoMatch) {
      const videoId = videoMatch[1];
      return `https://player.twitch.tv/?video=${videoId}&parent=${parent}&muted=false`;
    }
    
    // Twitch clip URL: https://clips.twitch.tv/CLIP_ID or https://www.twitch.tv/channel/clip/CLIP_ID
    const clipMatch = url.match(/(?:clips\.twitch\.tv\/|twitch\.tv\/[^\/]+\/clip\/)([a-zA-Z0-9_-]+)/);
    if (clipMatch) {
      const clipId = clipMatch[1];
      return `https://clips.twitch.tv/embed?clip=${clipId}&parent=${parent}&muted=false`;
    }
    
    // Twitch channel URL: https://www.twitch.tv/channelname (must be last to avoid false matches)
    const channelMatch = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)(?:\?|$|\/|$)/);
    if (channelMatch && channelMatch[1] !== 'videos' && channelMatch[1] !== 'clip') {
      const channelName = channelMatch[1];
      return `https://player.twitch.tv/?channel=${channelName}&parent=${parent}&muted=false`;
    }
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      console.error('Error processing Twitch URL:', error);
    }
  }
  
  // Return original URL if no Twitch pattern matched
  return url;
}

/**
 * Processes an embed URL to ensure it's in the correct format
 * - Twitch URLs are converted to embed format with parent parameter
 * - YouTube URLs are left as-is (already in embed format)
 * - Other URLs are returned unchanged
 */
export function processEmbedUrl(url: string): string {
  if (!url) return url;
  
  // Check if it's a Twitch URL
  if (url.includes('twitch.tv') || url.includes('player.twitch.tv') || url.includes('clips.twitch.tv')) {
    return processTwitchUrl(url);
  }
  
  // Return other URLs as-is (YouTube, etc.)
  return url;
}

