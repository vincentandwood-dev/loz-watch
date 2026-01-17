# Deployment Guide for loz.watch

## Production Readiness Checklist

✅ **Code Audit Complete**
- All console.error calls are appropriate for production (error logging only)
- No hardcoded localhost URLs in production code
- Environment variables properly referenced
- No development-only debug code

✅ **Environment Variables**
- `NEXT_PUBLIC_SUPABASE_URL` - Required for database access
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Required for database access
- No additional environment variables needed (all APIs are public)

✅ **Build Configuration**
- Build command: `npm run build`
- Output: Next.js default (`.next` directory)
- Framework: Next.js (auto-detected by Vercel)

## Vercel Deployment Steps

### 1. Prerequisites
- Vercel account (sign up at https://vercel.com)
- GitHub/GitLab/Bitbucket repository with your code
- Supabase project with `locations` table configured

### 2. Connect Repository to Vercel
1. Log in to Vercel dashboard
2. Click "Add New Project"
3. Import your repository
4. Vercel will auto-detect Next.js framework

### 3. Configure Environment Variables
In Vercel project settings → Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important:** These are public variables (NEXT_PUBLIC_ prefix), safe to expose in client code.

### 4. Build Settings (Auto-detected)
- **Framework Preset:** Next.js
- **Build Command:** `npm run build` (default)
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install` (default)

### 5. Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Your site will be available at `your-project.vercel.app`

### 6. Custom Domain Setup (loz.watch)
1. Go to Project Settings → Domains
2. Add `loz.watch` and `www.loz.watch`
3. Follow DNS configuration instructions:
   - Add A record pointing to Vercel's IP (provided in dashboard)
   - Or add CNAME record pointing to `cname.vercel-dns.com`
4. Wait for DNS propagation (usually 5-60 minutes)
5. SSL certificate will be automatically provisioned

## Post-Deployment Verification

### 1. Check Production Build
- Visit your deployed site
- Open browser console (F12)
- Verify no console errors (only expected error logs for failed API calls)

### 2. Test Core Features
- ✅ Map loads and displays correctly
- ✅ Locations appear on map
- ✅ Status bar shows lake conditions
- ✅ Weather alerts display (if active)
- ✅ Traffic incidents display (if any)
- ✅ Local incidents display (if any)
- ✅ Top story banner appears (if story exists)
- ✅ Footer with disclaimer is visible
- ✅ "About loz.watch" modal opens correctly

### 3. Test Empty States
- Verify site behaves gracefully when:
  - No weather alerts exist
  - No traffic incidents exist
  - No local incidents exist
  - No top story exists
- Status bar should remain calm and reassuring

### 4. Test Mobile Experience
- Open site on mobile device
- Verify:
  - Status bar is readable
  - Search/filter controls are accessible
  - Incident panels slide up correctly
  - Footer is visible
  - All tap targets are appropriately sized

## Environment Variables Reference

### Required for Production

| Variable | Description | Where to Get It |
|----------|-------------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key | Supabase Dashboard → Settings → API → anon/public key |

### Optional (Not Required)
- No optional environment variables needed
- All external APIs (NOAA, OpenStreetMap, Ameren) are public and require no authentication

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify Node.js version (Vercel uses Node 18+ by default)
- Check build logs for specific errors

### Map Not Loading
- Verify Supabase environment variables are set correctly
- Check browser console for errors
- Verify Supabase RLS policies allow public read access

### Environment Variables Not Working
- Ensure variables are prefixed with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding/changing environment variables
- Check that variables are set for "Production" environment in Vercel

### Domain Not Working
- Wait for DNS propagation (can take up to 48 hours)
- Verify DNS records are correct
- Check Vercel domain configuration

## Soft Launch Safeguards

✅ **Disclaimer Language**
- Footer displays: "Information shown is compiled from publicly available sources for situational awareness only. Not an emergency service."
- All incident panels include the same disclaimer
- About modal clearly states what loz.watch is and is not

✅ **Data Labeling**
- All incidents labeled as "Publicly Reported Information"
- Sources clearly attributed with clickable links
- No claims of official authority

✅ **Quiet-Day Behavior**
- Empty states display friendly messages
- Status bar remains calm when no alerts exist
- No alarming language when nothing is happening
- Site feels reassuring on quiet days

## Production URLs

After deployment, your site will be available at:
- `https://your-project.vercel.app` (Vercel default)
- `https://loz.watch` (after custom domain setup)
- `https://www.loz.watch` (after custom domain setup)

## Support

For deployment issues:
- Vercel Documentation: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- Supabase Setup: See `SUPABASE_SETUP.md


