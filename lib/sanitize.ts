/**
 * Content Sanitization Utility
 * Prevents XSS attacks by sanitizing user-generated and external content
 */

/**
 * Sanitizes HTML content by removing potentially dangerous tags and attributes
 * Returns plain text with HTML entities escaped
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Remove all HTML tags
  let sanitized = html.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities first
  sanitized = decodeHtmlEntities(sanitized);
  
  // Escape remaining HTML entities
  sanitized = escapeHtml(sanitized);
  
  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
}

/**
 * Sanitizes plain text by escaping HTML entities
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return escapeHtml(text.trim());
}

/**
 * Escapes HTML entities to prevent XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Decodes HTML entities (server-safe implementation)
 */
function decodeHtmlEntities(text: string): string {
  // Simple HTML entity decoding without DOM
  const entityMap: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&apos;': "'",
  };
  
  let decoded = text;
  for (const [entity, char] of Object.entries(entityMap)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }
  
  // Decode numeric entities (basic support)
  decoded = decoded.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  
  return decoded;
}

/**
 * Sanitizes a URL to prevent javascript: and data: schemes
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  const trimmed = url.trim();
  
  // Block dangerous URL schemes
  const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = trimmed.toLowerCase();
  
  for (const scheme of dangerousSchemes) {
    if (lowerUrl.startsWith(scheme)) {
      return '#';
    }
  }
  
  // Only allow http, https, and relative URLs
  if (!trimmed.match(/^(https?:\/\/|\/)/i)) {
    return '#';
  }
  
  return trimmed;
}

/**
 * Truncates text to a maximum length
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength) + '...';
}

