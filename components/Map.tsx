'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { Location, LocationType } from '@/lib/types';
import { fetchLocations } from '@/lib/supabase';
import { processEmbedUrl } from '@/lib/embed-utils';
import { fetchTrafficIncidents, TrafficIncident, formatIncidentType } from '@/lib/traffic-incidents';
import { fetchLocalIncidents, fetchTopStory, LocalIncident, formatTimeSince, IncidentCategory, TopStory } from '@/lib/local-intelligence';
import StatusBar from './StatusBar';
import TopStoryBanner from './TopStoryBanner';
import Footer from './Footer';

// Fix for default marker icons in Next.js
import 'leaflet/dist/leaflet.css';

// Lake of the Ozarks center coordinates
// Adjusted to show both Camdenton and Eldon
const LAKE_CENTER: [number, number] = [38.15, -92.75];

// Map bounds for Lake of the Ozarks watch area
// Prevents panning too far outside the region
const LOZ_MAX_BOUNDS: [[number, number], [number, number]] = [
  [38.00, -93.00], // Southwest corner
  [38.30, -92.50], // Northeast corner
];

// Watch area polygon coordinates (Camdenton, Eldon, Sunrise Beach region)
const WATCH_AREA_POLYGON: [number, number][] = [
  [38.25, -92.90], // Camdenton area (northwest)
  [38.25, -92.60], // East of Camdenton
  [38.05, -92.60], // Sunrise Beach area (southeast)
  [38.05, -92.90], // West of Sunrise Beach
  [38.25, -92.90], // Close polygon
];

// Custom marker icons by location type
const getMarkerIcon = (type: LocationType): L.Icon => {
  const iconColors: Record<LocationType, string> = {
    restaurant: '#10b981', // green
    marina: '#3b82f6',      // blue
    bar: '#ef4444',         // red
  };

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${iconColors[type]};
        width: 24px;
        height: 24px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        <div style="
          transform: rotate(45deg);
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        "></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
  }) as L.Icon;
};

// Traffic incident marker icon (distinct from location markers)
// Visual hierarchy: alert > advisory > info (size and opacity)
const getIncidentIcon = (severity: 'info' | 'advisory' | 'alert'): L.Icon => {
  const colors: Record<'info' | 'advisory' | 'alert', string> = {
    info: '#6b7280',      // gray
    advisory: '#f59e0b',  // amber
    alert: '#ef4444',     // red
  };
  
  // Size and opacity based on severity (alert = largest/most visible)
  const sizes: Record<'info' | 'advisory' | 'alert', number> = {
    info: 18,
    advisory: 20,
    alert: 22,
  };
  
  const opacities: Record<'info' | 'advisory' | 'alert', number> = {
    info: 0.7,
    advisory: 0.85,
    alert: 1.0,
  };

  const size = sizes[severity];
  const opacity = opacities[severity];

  return L.divIcon({
    className: 'incident-marker',
    html: `
      <div style="
        background-color: ${colors[severity]};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size - 6}px;
        color: white;
        font-weight: bold;
        opacity: ${opacity};
      ">⚠</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  }) as L.Icon;
};

// Local incident marker icon (distinct from traffic incidents and locations)
// Visual hierarchy: alert > advisory > info (size and opacity)
const getLocalIncidentIcon = (severity: 'info' | 'advisory' | 'alert'): L.Icon => {
  const colors: Record<'info' | 'advisory' | 'alert', string> = {
    info: '#8b5cf6',      // purple
    advisory: '#f59e0b',  // amber
    alert: '#ef4444',     // red
  };
  
  // Size and opacity based on severity (alert = largest/most visible)
  const sizes: Record<'info' | 'advisory' | 'alert', number> = {
    info: 20,
    advisory: 22,
    alert: 24,
  };
  
  const opacities: Record<'info' | 'advisory' | 'alert', number> = {
    info: 0.7,
    advisory: 0.85,
    alert: 1.0,
  };

  const size = sizes[severity];
  const opacity = opacities[severity];

  return L.divIcon({
    className: 'local-incident-marker',
    html: `
      <div style="
        background-color: ${colors[severity]};
        width: ${size}px;
        height: ${size}px;
        border-radius: 4px;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${size - 8}px;
        color: white;
        font-weight: bold;
        transform: rotate(45deg);
        opacity: ${opacity};
      ">
        <div style="transform: rotate(-45deg);">📰</div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  }) as L.Icon;
};

interface LocationPanelProps {
  location: Location | null;
  isOpen: boolean;
  onClose: () => void;
}

function LocationPanel({ location, isOpen, onClose }: LocationPanelProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [shouldLoadIframe, setShouldLoadIframe] = useState(false);

  useEffect(() => {
    // Prevent body scroll when panel is open on mobile
    if (isOpen) {
      document.body.classList.add('panel-open');
      // Lazy load iframe only when panel opens
      setShouldLoadIframe(true);
    } else {
      document.body.classList.remove('panel-open');
      setIframeLoaded(false);
      setShouldLoadIframe(false);
    }

    return () => {
      document.body.classList.remove('panel-open');
    };
  }, [isOpen]);

  if (!location) return null;

  const typeLabels: Record<LocationType, string> = {
    restaurant: 'Restaurant',
    marina: 'Marina',
    bar: 'Bar',
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`
          fixed inset-0 bg-black transition-opacity duration-300 z-40
          ${isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-up panel */}
      <div
        className={`
          fixed left-0 right-0 bottom-0 bg-white rounded-t-2xl shadow-2xl z-50
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
          md:left-auto md:right-4 md:bottom-4 md:top-auto md:w-96 md:rounded-2xl
          md:max-h-[60vh] md:translate-y-0
          ${isOpen ? 'md:translate-x-0' : 'md:translate-x-[calc(100%+1rem)]'}
          h-[45vh] md:h-auto
          flex flex-col
        `}
      >
        {/* Panel header with drag handle */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{location.name}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {typeLabels[location.type]}
              {location.isOpen !== undefined && (
                <span className={`ml-2 ${location.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                  {location.isOpen ? 'Open' : 'Closed'}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close panel"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drag handle for mobile */}
        <div className="md:hidden w-12 h-1 bg-gray-300 rounded-full mx-auto -mt-2 mb-2" />

        {/* Panel content */}
        <div className="flex-1 overflow-y-auto p-4">
          {location.camEmbedUrl && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Live Camera</h3>
              <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden">
                {!iframeLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-pulse text-gray-400">Loading camera...</div>
                  </div>
                )}
                {shouldLoadIframe && (
                  <iframe
                    src={processEmbedUrl(location.camEmbedUrl)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    onLoad={() => setIframeLoaded(true)}
                    loading="lazy"
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

interface IncidentPanelProps {
  incident: TrafficIncident | null;
  isOpen: boolean;
  onClose: () => void;
}

function IncidentPanel({ incident, isOpen, onClose }: IncidentPanelProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('panel-open');
    } else {
      document.body.classList.remove('panel-open');
    }

    return () => {
      document.body.classList.remove('panel-open');
    };
  }, [isOpen]);

  if (!incident) return null;

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Unknown time';
    }
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`
          fixed inset-0 bg-black transition-opacity duration-300 z-40
          ${isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-up panel */}
      <div
        className={`
          fixed left-0 right-0 bottom-0 bg-white rounded-t-2xl shadow-2xl z-50
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
          md:left-auto md:right-4 md:bottom-4 md:top-auto md:w-96 md:rounded-2xl
          md:max-h-[60vh] md:translate-y-0
          ${isOpen ? 'md:translate-x-0' : 'md:translate-x-[calc(100%+1rem)]'}
          h-[45vh] md:h-auto
          flex flex-col
        `}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">Traffic Incident</h2>
            <p className="text-sm text-gray-600 mt-1">
              {formatIncidentType(incident.type)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close panel"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drag handle for mobile */}
        <div className="md:hidden w-12 h-1 bg-gray-300 rounded-full mx-auto -mt-2 mb-2" />

        {/* Panel content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
              <p className="text-sm text-gray-900">{incident.description}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Reported</h3>
              <p className="text-sm text-gray-600">{formatTimestamp(incident.timestamp)}</p>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 italic">
                Traffic / Public Incident Data
              </p>
              <p className="text-xs text-gray-500 mt-1">
                This information is provided for informational purposes only and does not represent official emergency response data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

interface LocalIncidentPanelProps {
  incident: LocalIncident | null;
  isOpen: boolean;
  onClose: () => void;
}

function LocalIncidentPanel({ incident, isOpen, onClose }: LocalIncidentPanelProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('panel-open');
    } else {
      document.body.classList.remove('panel-open');
    }

    return () => {
      document.body.classList.remove('panel-open');
    };
  }, [isOpen]);

  if (!incident) return null;

  const typeLabels: Record<IncidentCategory, string> = {
    crime: 'Crime',
    accident: 'Accident',
    boating: 'Boating Incident',
    fire: 'Fire',
    advisory: 'Advisory',
    other: 'Incident',
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`
          fixed inset-0 bg-black transition-opacity duration-300 z-40
          ${isOpen ? 'opacity-50' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-up panel */}
      <div
        className={`
          fixed left-0 right-0 bottom-0 bg-white rounded-t-2xl shadow-2xl z-50
          transition-transform duration-300 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
          md:left-auto md:right-4 md:bottom-4 md:top-auto md:w-96 md:rounded-2xl
          md:max-h-[60vh] md:translate-y-0
          ${isOpen ? 'md:translate-x-0' : 'md:translate-x-[calc(100%+1rem)]'}
          h-[45vh] md:h-auto
          flex flex-col
        `}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">Lake Area Activity</h2>
            <p className="text-sm text-gray-600 mt-1">
              {typeLabels[incident.type]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close panel"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Drag handle for mobile */}
        <div className="md:hidden w-12 h-1 bg-gray-300 rounded-full mx-auto -mt-2 mb-2" />

        {/* Panel content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
              <p className="text-sm text-gray-900">{incident.title}</p>
              {incident.summary && incident.summary !== incident.title && (
                <p className="text-sm text-gray-700 mt-1">{incident.summary}</p>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Reported</h3>
              <p className="text-sm text-gray-600">{formatTimeSince(incident.timestamp)}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Source</h3>
              <p className="text-sm text-gray-600">
                {incident.sourceUrl ? (
                  <a
                    href={incident.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    {incident.source}
                  </a>
                ) : (
                  incident.source
                )}
              </p>
            </div>

            <div className="pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500 italic">
                Information shown is compiled from publicly available sources for situational awareness only. Not an emergency service.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

interface IncidentListViewProps {
  incidents: LocalIncident[];
  onIncidentClick: (incident: LocalIncident) => void;
}

function IncidentListView({ incidents, onIncidentClick }: IncidentListViewProps) {
  if (incidents.length === 0) {
    return (
      <div className="absolute bottom-4 left-4 right-4 z-25 md:left-auto md:right-4 md:w-80 md:bottom-20">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/50 p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Recent Lake Area Activity (7d)
            </h3>
            <span className="text-xs text-gray-500">0</span>
          </div>
          <p className="text-xs text-gray-500 italic py-2">
            No reported incidents in the last 7 days.
          </p>
        </div>
      </div>
    );
  }

  // Sort newest to oldest
  const sortedIncidents = [...incidents].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return (
    <div className="absolute bottom-4 left-4 right-4 z-25 md:left-auto md:right-4 md:w-80 md:bottom-20">
      <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/60 p-4 max-h-[180px] md:max-h-[280px] overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Recent Lake Area Activity (7d)
          </h3>
          <span className="text-xs text-gray-500">{incidents.length}</span>
        </div>
        <div className="space-y-2">
          {sortedIncidents.map((incident) => (
            <button
              key={incident.id}
              onClick={() => onIncidentClick(incident)}
              className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {incident.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatTimeSince(incident.timestamp)} ·{' '}
                    {incident.sourceUrl ? (
                      <a
                        href={incident.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {incident.source}
                      </a>
                    ) : (
                      incident.source
                    )}
                  </p>
                </div>
                <div className={`
                  flex-shrink-0 w-2 h-2 rounded-full mt-1
                  ${incident.severity === 'alert' ? 'bg-red-500' : 
                    incident.severity === 'advisory' ? 'bg-yellow-500' : 
                    'bg-gray-400'}
                `} />
              </div>
            </button>
          ))}
        </div>
        <div className="mt-3 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 italic">
            Information shown is compiled from publicly available sources for situational awareness only. Not an emergency service.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Map() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [trafficIncidents, setTrafficIncidents] = useState<TrafficIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<TrafficIncident | null>(null);
  const [isIncidentPanelOpen, setIsIncidentPanelOpen] = useState(false);
  const [localIncidents, setLocalIncidents] = useState<LocalIncident[]>([]);
  const [selectedLocalIncident, setSelectedLocalIncident] = useState<LocalIncident | null>(null);
  const [isLocalIncidentPanelOpen, setIsLocalIncidentPanelOpen] = useState(false);
  const [topStory, setTopStory] = useState<TopStory | null>(null);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTypes, setActiveTypes] = useState<Set<LocationType>>(new Set(['restaurant', 'marina', 'bar']));
  
  // Incident filter state
  const [showTrafficIncidents, setShowTrafficIncidents] = useState(true);
  const [showLocalIncidents, setShowLocalIncidents] = useState(true);

  // Fetch locations from Supabase on component mount
  useEffect(() => {
    async function loadLocations() {
      const data = await fetchLocations();
      setLocations(data);
    }
    loadLocations();
  }, []);

  // Fetch traffic incidents
  useEffect(() => {
    async function loadIncidents() {
      const incidents = await fetchTrafficIncidents();
      setTrafficIncidents(incidents);
    }
    loadIncidents();
    
    // Refresh every 10 minutes
    const interval = setInterval(loadIncidents, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch local incidents and top story
  useEffect(() => {
    async function loadLocalIntelligence() {
      const [incidents, story] = await Promise.all([
        fetchLocalIncidents(),
        fetchTopStory(),
      ]);
      setLocalIncidents(incidents);
      setTopStory(story);
    }
    loadLocalIntelligence();
    
    // Refresh every 15 minutes
    const interval = setInterval(loadLocalIntelligence, 15 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Memoize event handlers to prevent unnecessary re-renders
  const handleMarkerClick = useCallback((location: Location) => {
    setSelectedLocation(location);
    setIsPanelOpen(true);
  }, []);

  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false);
    // Delay clearing selected location to allow animation to complete
    setTimeout(() => {
      setSelectedLocation(null);
    }, 300);
  }, []);

  const handleIncidentClick = useCallback((incident: TrafficIncident) => {
    setSelectedIncident(incident);
    setIsIncidentPanelOpen(true);
    // Close location panel if open
    if (isPanelOpen) {
      setIsPanelOpen(false);
    }
  }, [isPanelOpen]);

  const handleCloseIncidentPanel = useCallback(() => {
    setIsIncidentPanelOpen(false);
    setTimeout(() => {
      setSelectedIncident(null);
    }, 300);
  }, []);

  const handleLocalIncidentClick = useCallback((incident: LocalIncident) => {
    setSelectedLocalIncident(incident);
    setIsLocalIncidentPanelOpen(true);
    // Close other panels if open
    if (isPanelOpen) setIsPanelOpen(false);
    if (isIncidentPanelOpen) setIsIncidentPanelOpen(false);
  }, [isPanelOpen, isIncidentPanelOpen]);

  const handleCloseLocalIncidentPanel = useCallback(() => {
    setIsLocalIncidentPanelOpen(false);
    setTimeout(() => {
      setSelectedLocalIncident(null);
    }, 300);
  }, []);

  // Filter locations based on search query and active type filters
  const filteredLocations = locations.filter((location) => {
    // Filter by search query (case-insensitive)
    const matchesSearch = searchQuery === '' || 
      location.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by type
    const matchesType = activeTypes.has(location.type);
    
    return matchesSearch && matchesType;
  });

  // Memoize toggle function to prevent unnecessary re-renders
  const toggleTypeFilter = useCallback((type: LocationType) => {
    setActiveTypes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(type)) {
        newSet.delete(type);
      } else {
        newSet.add(type);
      }
      // Prevent all filters from being disabled
      if (newSet.size === 0) {
        return prev;
      }
      return newSet;
    });
  }, []);

  // Fix Leaflet default icon issue
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });
  }, []);

  return (
    <div className="relative h-full w-full">
      {/* Status Bar */}
      <StatusBar
        condition="normal"
        alertCount={0}
      />

      {/* Top Story Banner */}
      <TopStoryBanner story={topStory} />

      {/* Search and Filter Overlay - subtle, tool-like appearance */}
      <div className={`absolute left-4 right-4 z-30 md:left-4 md:right-auto md:w-80 ${topStory ? 'top-44' : 'top-24'} transition-all duration-300`}>
        <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/60 p-4 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 pl-10 text-sm border border-gray-200 rounded-lg bg-white/90 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 transition-all"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Type Filter Toggles */}
          <div className="flex flex-wrap gap-2">
            {(['restaurant', 'marina', 'bar'] as LocationType[]).map((type) => {
              const isActive = activeTypes.has(type);
              const typeColors: Record<LocationType, string> = {
                restaurant: 'bg-green-500',
                marina: 'bg-blue-500',
                bar: 'bg-red-500',
              };
              const typeLabels: Record<LocationType, string> = {
                restaurant: 'Restaurant',
                marina: 'Marina',
                bar: 'Bar',
              };

              return (
                <button
                  key={type}
                  onClick={() => toggleTypeFilter(type)}
                  className={`
                    px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200
                    ${isActive
                      ? `${typeColors[type]} text-white shadow-md hover:shadow-lg`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                    }
                  `}
                  aria-label={`Toggle ${typeLabels[type]} filter`}
                >
                  {typeLabels[type]}
                </button>
              );
            })}
          </div>

          {/* Incident Filters */}
          <div className="pt-2 border-t border-gray-200">
            <div className="text-xs font-medium text-gray-700 mb-2">Incident Filters</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowTrafficIncidents(!showTrafficIncidents)}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200
                  ${showTrafficIncidents
                    ? 'bg-amber-500 text-white shadow-md hover:shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                  }
                `}
              >
                Traffic ({trafficIncidents.length + localIncidents.filter(i => i.type === 'accident').length})
              </button>
              <button
                onClick={() => setShowLocalIncidents(!showLocalIncidents)}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200
                  ${showLocalIncidents
                    ? 'bg-purple-500 text-white shadow-md hover:shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                  }
                `}
              >
                Local ({localIncidents.length})
              </button>
            </div>
          </div>

          {/* Results count */}
          {(filteredLocations.length !== locations.length || !showTrafficIncidents || !showLocalIncidents) && (
            <div className="text-xs text-gray-500 pt-1 border-t border-gray-200">
              Showing {filteredLocations.length} of {locations.length} locations
              {(!showTrafficIncidents || !showLocalIncidents) && (
                <span className="ml-1">
                  · {(() => {
                    let count = 0;
                    if (showTrafficIncidents) {
                      count += trafficIncidents.length;
                      // Add accidents from local incidents when traffic filter is on
                      count += localIncidents.filter(i => i.type === 'accident').length;
                    }
                    if (showLocalIncidents) {
                      // Count local incidents, excluding accidents if traffic filter is also on (to avoid double counting)
                      const localCount = showTrafficIncidents 
                        ? localIncidents.filter(i => i.type !== 'accident').length
                        : localIncidents.length;
                      count += localCount;
                    }
                    return count;
                  })()} incidents visible
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <MapContainer
        center={LAKE_CENTER}
        zoom={13}
        minZoom={12}
        maxZoom={18}
        maxBounds={LOZ_MAX_BOUNDS}
        maxBoundsViscosity={1.0}
        className="h-full w-full z-0"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Subtle watch area outline */}
        <Polygon
          positions={WATCH_AREA_POLYGON}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.05,
            weight: 1.5,
            opacity: 0.3,
          }}
          interactive={false}
        />
        {filteredLocations.map((location) => (
          <Marker
            key={location.id}
            position={[location.lat, location.lng]}
            icon={getMarkerIcon(location.type)}
            eventHandlers={{
              click: () => handleMarkerClick(location),
            }}
          />
        ))}
        {/* Traffic incidents + Local incidents with type "accident" when traffic filter is enabled */}
        {showTrafficIncidents && (
          <>
            {trafficIncidents.map((incident) => (
              <Marker
                key={incident.id}
                position={[incident.lat, incident.lng]}
                icon={getIncidentIcon(incident.severity)}
                eventHandlers={{
                  click: () => handleIncidentClick(incident),
                }}
              />
            ))}
            {/* Show local incidents with type "accident" when traffic filter is enabled */}
            {localIncidents
              .filter((incident) => 
                incident.type === 'accident' &&
                incident.lat != null && 
                incident.lng != null && 
                !isNaN(incident.lat) && 
                !isNaN(incident.lng)
              )
              .map((incident) => (
                <Marker
                  key={`local-${incident.id}`}
                  position={[incident.lat!, incident.lng!]}
                  icon={getIncidentIcon(incident.severity)}
                  eventHandlers={{
                    click: () => handleLocalIncidentClick(incident),
                  }}
                />
              ))}
          </>
        )}
        {/* Local incidents (excluding accidents when traffic filter is enabled, to avoid duplicates) */}
        {showLocalIncidents && localIncidents
          .filter((incident) => 
            // Exclude accidents if traffic filter is also enabled (to avoid showing them twice)
            !(showTrafficIncidents && incident.type === 'accident') &&
            incident.lat != null && 
            incident.lng != null && 
            !isNaN(incident.lat) && 
            !isNaN(incident.lng)
          )
          .map((incident) => (
            <Marker
              key={incident.id}
              position={[incident.lat!, incident.lng!]}
              icon={getLocalIncidentIcon(incident.severity)}
              eventHandlers={{
                click: () => handleLocalIncidentClick(incident),
              }}
            />
          ))}
      </MapContainer>

      <LocationPanel
        location={selectedLocation}
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
      />

      <IncidentPanel
        incident={selectedIncident}
        isOpen={isIncidentPanelOpen}
        onClose={handleCloseIncidentPanel}
      />

      <LocalIncidentPanel
        incident={selectedLocalIncident}
        isOpen={isLocalIncidentPanelOpen}
        onClose={handleCloseLocalIncidentPanel}
      />

      <IncidentListView
        incidents={localIncidents}
        onIncidentClick={handleLocalIncidentClick}
      />

      <Footer />
    </div>
  );
}

