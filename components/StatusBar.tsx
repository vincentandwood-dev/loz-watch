'use client';

import { useEffect, useState, useMemo, memo } from 'react';
import { fetchWeatherAlerts, getHighestSeverity, getShortAlertName, WeatherAlert, AlertSeverity } from '@/lib/weather-alerts';
import { fetchTrafficIncidents, TrafficIncident, getHighestIncidentSeverity } from '@/lib/traffic-incidents';

/**
 * StatusBar Component
 * Displays current lake conditions and status at a glance
 * Fetches real-time data from Ameren's Lake of the Ozarks reports
 * Fetches weather alerts from NOAA Weather API
 * Sources:
 * - https://www.ameren.com/property/lake-of-the-ozarks/reports
 * - https://www.weather.gov/documentation/services-web-api
 */

export type ConditionLevel = 'normal' | 'advisory' | 'alert';

interface LakeStatus {
  lakeLevel: number | null;
  waterTemp: number | null;
  riverLevel: number | null;
  lastUpdated: string;
  error?: string;
}

interface StatusBarProps {
  condition?: ConditionLevel;
  alertCount?: number;
  // Static lake condition fields (configurable in code)
  lakeConditionNote?: string; // Example: "Light debris reported"
}

// Normal operating range for Lake of the Ozarks (in feet)
// Target level is 655 feet, normal range is 654-656 feet
const NORMAL_LAKE_LEVEL_MIN = 654.0;
const NORMAL_LAKE_LEVEL_MAX = 656.0;

function StatusBar({
  condition: initialCondition = 'normal',
  alertCount: initialAlertCount = 0,
  lakeConditionNote,
}: StatusBarProps) {
  const [lakeStatus, setLakeStatus] = useState<LakeStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlert[]>([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true);
  const [trafficIncidents, setTrafficIncidents] = useState<TrafficIncident[]>([]);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(true);

  // Fetch lake status data
  useEffect(() => {
    async function fetchLakeStatus() {
      try {
        const response = await fetch('/api/lake-status');
        const data = await response.json();
        setLakeStatus(data);
      } catch (error) {
        // Log error in development only
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching lake status:', error);
        }
        setLakeStatus({
          lakeLevel: null,
          waterTemp: null,
          riverLevel: null,
          lastUpdated: new Date().toISOString(),
          error: 'Failed to load',
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchLakeStatus();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchLakeStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch weather alerts
  useEffect(() => {
    async function fetchAlerts() {
      try {
        const alerts = await fetchWeatherAlerts();
        setWeatherAlerts(alerts);
      } catch (error) {
        // Log error in development only
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching weather alerts:', error);
        }
        setWeatherAlerts([]);
      } finally {
        setIsLoadingAlerts(false);
      }
    }

    fetchAlerts();
    
    // Conservative refresh every 15 minutes
    const interval = setInterval(fetchAlerts, 15 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Fetch traffic incidents
  useEffect(() => {
    async function fetchIncidents() {
      try {
        const incidents = await fetchTrafficIncidents();
        setTrafficIncidents(incidents);
      } catch (error) {
        // Log error in development only
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching traffic incidents:', error);
        }
        setTrafficIncidents([]);
      } finally {
        setIsLoadingIncidents(false);
      }
    }

    fetchIncidents();
    
    // Refresh every 10 minutes
    const interval = setInterval(fetchIncidents, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Memoize condition calculations
  const conditionData = useMemo(() => {
    const alertSeverity = getHighestSeverity(weatherAlerts);
    const trafficIncidentSeverity = getHighestIncidentSeverity(trafficIncidents);
    
    let effectiveCondition: ConditionLevel = initialCondition;
    
    // Priority: Weather Alerts > Traffic Incidents > Normal Conditions
    if (alertSeverity === 'warning') {
      effectiveCondition = 'alert';
    } else if (alertSeverity === 'watch' || alertSeverity === 'advisory') {
      effectiveCondition = 'advisory';
    } else if (trafficIncidentSeverity === 'alert' || trafficIncidentSeverity === 'advisory' || trafficIncidentSeverity === 'info') {
      effectiveCondition = 'advisory';
    }

    // Color system for condition levels
    const conditionStyles: Record<ConditionLevel, { color: string; label: string; emoji: string }> = {
      normal: {
        color: 'text-green-600',
        label: 'Normal Conditions',
        emoji: '🟢',
      },
      advisory: {
        color: 'text-yellow-600',
        label: 'Advisory',
        emoji: '🟡',
      },
      alert: {
        color: 'text-red-600',
        label: 'Alert',
        emoji: '🔴',
      },
    };

    return {
      alertSeverity,
      effectiveCondition,
      currentStyle: conditionStyles[effectiveCondition],
    };
  }, [weatherAlerts, trafficIncidents, initialCondition]);

  const { alertSeverity, effectiveCondition, currentStyle } = conditionData;
  
  // Memoize alert text formatting
  const formatAlertText = useMemo(() => {
    if (isLoadingAlerts) {
      return 'Loading alerts...';
    }

    if (weatherAlerts.length === 0) {
      return initialAlertCount === 0 ? 'No Active Alerts' : `${initialAlertCount} Active Alert${initialAlertCount !== 1 ? 's' : ''}`;
    }

    // Show the highest severity alert
    const primaryAlert = weatherAlerts[0];
    const alertName = getShortAlertName(primaryAlert);
    const count = weatherAlerts.length;
    
    if (count === 1) {
      return alertName;
    }
    
    return `${alertName} (+${count - 1} more)`;
  }, [weatherAlerts, isLoadingAlerts, initialAlertCount]);

  // Memoize formatted values
  const formattedValues = useMemo(() => {
    const formatTemperature = (): string | null => {
      if (isLoading || !lakeStatus || lakeStatus.error || lakeStatus.waterTemp === null) {
        return null;
      }
      return `${lakeStatus.waterTemp}°F`;
    };

    const formatLakeLevel = (): string | null => {
      if (isLoading || !lakeStatus || lakeStatus.error || lakeStatus.lakeLevel === null) {
        return null;
      }
      return `${lakeStatus.lakeLevel.toFixed(1)}'`;
    };

    const getBackgroundColor = () => {
      if (alertSeverity === 'warning') {
        return 'bg-red-50/95 border-red-200';
      }
      if (alertSeverity === 'watch' || alertSeverity === 'advisory') {
        return 'bg-yellow-50/95 border-yellow-200';
      }
      return 'bg-white/95 border-gray-200';
    };

    return {
      temperature: formatTemperature(),
      lakeLevel: formatLakeLevel(),
      backgroundColor: getBackgroundColor(),
    };
  }, [isLoading, lakeStatus, alertSeverity]);

  return (
    <div className={`absolute top-0 left-0 right-0 z-20 ${formattedValues.backgroundColor} backdrop-blur-sm border-b transition-colors duration-200`}>
      <div className="px-4 py-2 md:px-6">
        <div className="flex flex-col gap-2">
          {/* Primary status line - Conditions, Lake Level, Temp, Debris */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Conditions */}
              <span className={`${currentStyle.color} font-medium`}>
                {currentStyle.emoji} {currentStyle.label}
              </span>
              
              {/* Lake Level */}
              {formattedValues.lakeLevel && (
                <>
                  <span className="text-gray-400 hidden sm:inline">·</span>
                  <span className="text-gray-700 font-medium">
                    Lake Level {formattedValues.lakeLevel}
                  </span>
                </>
              )}
              
              {/* Temperature */}
              {formattedValues.temperature && (
                <>
                  <span className="text-gray-400 hidden sm:inline">·</span>
                  <span className="text-gray-700 font-medium">
                    Temp {formattedValues.temperature}
                  </span>
                </>
              )}
              
              {/* Debris */}
              {lakeConditionNote && (
                <>
                  <span className="text-gray-400 hidden sm:inline">·</span>
                  <span className="text-gray-700 italic">
                    {lakeConditionNote}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Secondary line - Weather alerts and traffic incidents */}
          {(weatherAlerts.length > 0 || trafficIncidents.length > 0) && (
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {weatherAlerts.length > 0 && (
                <span className={`${currentStyle.color} font-medium`}>
                  {formatAlertText}
                </span>
              )}
              {weatherAlerts.length > 0 && trafficIncidents.length > 0 && (
                <span className="text-gray-400">·</span>
              )}
              {trafficIncidents.length > 0 && (
                <span className="text-yellow-600 font-medium">
                  ⚠️ {trafficIncidents.length} Traffic Incident{trafficIncidents.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Memoize StatusBar to prevent unnecessary re-renders
export default memo(StatusBar) as typeof StatusBar;

