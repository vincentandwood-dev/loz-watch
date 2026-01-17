export type LocationType = 'restaurant' | 'marina' | 'bar';

export interface Location {
  id: string;
  name: string;
  type: LocationType;
  lat: number;
  lng: number;
  camEmbedUrl?: string;
  isOpen?: boolean;
}

