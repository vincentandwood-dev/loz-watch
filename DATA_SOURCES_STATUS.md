# Data Sources Status - loz.watch

## Current Data Validity Status

### ✅ REAL DATA (Live/Current)

1. **Lake Level & Temperature**
   - Source: Ameren Missouri website (scraped via `/api/lake-status`)
   - Status: ✅ Real-time data
   - Updates: Every 5 minutes
   - Location: `app/api/lake-status/route.ts`

2. **Weather Alerts**
   - Source: NOAA Weather API
   - Status: ✅ Real-time data
   - Updates: Every 15 minutes
   - Location: `lib/weather-alerts.ts`

3. **Traffic Incidents**
   - Source: OpenStreetMap Overpass API
   - Status: ✅ Real-time data
   - Updates: Every 10 minutes
   - Location: `lib/traffic-incidents.ts`

4. **Locations (Restaurants, Marinas, Bars)**
   - Source: Supabase database
   - Status: ✅ Real data (if Supabase is configured)
   - Updates: On page load
   - Location: `lib/supabase.ts`
   - Note: Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables

### ⚠️ PLACEHOLDER DATA (Not Real)

1. **Top Story Banner**
   - Source: Hardcoded placeholder
   - Status: ⚠️ Placeholder data
   - Current: Shows "Lake Level Drawdown Underway for Winter Season"
   - Location: `lib/local-intelligence.ts` (lines 99-106)
   - Action Needed: Replace with real scraping from Lake Expo or City of Lake Ozark

2. **Local Incidents (72-hour feed)**
   - Source: Hardcoded placeholder
   - Status: ⚠️ Placeholder data
   - Current: Shows 3 fake incidents:
     - Vehicle Accident on Highway 54
     - Boating Incident on Main Channel
     - Road Construction on Bagnell Dam Boulevard
   - Location: `lib/local-intelligence.ts` (lines 143-180)
   - Action Needed: Replace with real scraping from Lake Expo or City of Lake Ozark

3. **Debris Status**
   - Source: Hardcoded static prop
   - Status: ⚠️ Static text
   - Current: Always shows "Light debris reported"
   - Location: `components/Map.tsx` (line 767)
   - Action Needed: Make this dynamic or remove if not available

## Summary

**Real Data (4 sources):**
- ✅ Lake Level & Temperature
- ✅ Weather Alerts
- ✅ Traffic Incidents
- ✅ Locations (if Supabase configured)

**Placeholder/Static Data (3 sources):**
- ⚠️ Top Story Banner
- ⚠️ Local Incidents
- ⚠️ Debris Status

## Recommendations

1. **For Production Launch:**
   - Remove or clearly label placeholder data
   - Consider hiding Top Story Banner if no real data source
   - Consider hiding Local Incidents list if no real data source
   - Make Debris status dynamic or remove static text

2. **To Make All Data Real:**
   - Implement web scraping for Lake Expo news
   - Implement web scraping for City of Lake Ozark announcements
   - Add dynamic debris reporting (or remove if unavailable)

3. **Immediate Actions:**
   - Update `lib/local-intelligence.ts` to return `null` for top story if no real data
   - Update `lib/local-intelligence.ts` to return empty array for incidents if no real data
   - Remove hardcoded "Light debris reported" or make it conditional


