# Supabase Setup Guide

## Prerequisites

1. Create a Supabase account at https://supabase.com
2. Create a new project

## Database Setup

1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase/schema.sql`
4. Run the SQL script to create the `locations` table and insert initial mock data

## Environment Variables

1. In your Supabase project, go to Settings > API
2. Copy your Project URL and anon/public key
3. Create a `.env.local` file in the project root (copy from `.env.local.example` if it exists)
4. Add the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Verification

After setup, the map should automatically load locations from your Supabase database instead of using mock data.

If environment variables are not set, the app will still run but will show an empty map (no locations).

