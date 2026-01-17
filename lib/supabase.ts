import { createClient } from '@supabase/supabase-js';
import { Location } from './types';

// Supabase client configuration
// These environment variables should be set in .env.local (dev) or Vercel (production)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client only if environment variables are set
// Use placeholder values if not set to prevent errors (client will fail gracefully on queries)
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient('https://placeholder.supabase.co', 'placeholder-key');

// Database row type (snake_case)
interface LocationRow {
  id: string;
  name: string;
  type: 'restaurant' | 'marina' | 'bar';
  lat: number;
  lng: number;
  cam_embed_url: string | null;
  is_open: boolean | null;
}

/**
 * Fetch all locations from the database
 * Transforms database field names (snake_case) to TypeScript interface (camelCase)
 * @returns Promise<Location[]> Array of location objects
 */
export async function fetchLocations(): Promise<Location[]> {
  // Return empty array if Supabase is not configured
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables are not configured. Locations will not be loaded.');
    return [];
  }

  try {
    // Fetch all locations - explicitly set a high limit to ensure we get all rows
    // Supabase PostgREST has a default limit, so we set it high to get all locations
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name')
      .limit(10000); // High limit to fetch all locations (adjust if you expect more than 10k)

    if (error) {
      // Always log errors in production for debugging
      console.error('Error fetching locations from Supabase:', error);
      return [];
    }

    if (!data) {
      return [];
    }

    // Transform database rows to Location interface
    return data.map((row: LocationRow): Location => ({
      id: row.id,
      name: row.name,
      type: row.type,
      lat: Number(row.lat),
      lng: Number(row.lng),
      camEmbedUrl: row.cam_embed_url || undefined,
      isOpen: row.is_open ?? undefined,
    }));
  } catch (error) {
    // Always log errors for debugging
    console.error('Unexpected error fetching locations:', error);
    return [];
  }
}

