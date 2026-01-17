# loz.watch

Real-time situational awareness and live map platform for Lake of the Ozarks, Missouri.

## Overview

loz.watch provides a live, interactive map experience for visitors and locals at Lake of the Ozarks. The platform displays points of interest including restaurants, marinas, and bars with optional live camera feeds.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Maps:** Leaflet.js
- **Database:** Supabase (future implementation)

## Features

### Current
- Interactive map centered on Lake of the Ozarks
- Location pins by type (restaurant, marina, bar)
- Mobile-friendly slide-up panel for location details
- Lazy-loaded live camera embeds

### Planned
- Real-time data from Supabase
- User authentication
- Location search and filtering
- Traffic/crowd indicators
- Weather integration

## Project Structure

```
├── app/
│   ├── page.tsx          # Home page (full-screen map)
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   └── Map.tsx           # Main map component with slide-up panel
├── lib/
│   └── types.ts          # TypeScript type definitions
└── public/
    └── markers/          # Custom map marker icons
```

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Design Principles

1. **Map-first:** The map is the primary interface, not a feature
2. **Mobile-first:** Optimized for touch interactions
3. **Performance:** Lazy load heavy assets (iframes, images)
4. **Simplicity:** No unnecessary UI chrome or marketing content

## Constraints

- No authentication until explicitly requested
- No external APIs until explicitly requested
- No UI component libraries (Tailwind only)
- No premature optimization

## License

Private - All rights reserved

