# Quick Deploy Guide - loz.watch

## ✅ You're Ready to Deploy!

Your project is production-ready. Here's your step-by-step deployment checklist:

## Step 1: Push Code to GitHub (if not already done)

```bash
# If you haven't initialized git yet:
git init
git add .
git commit -m "Initial commit - ready for deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended for first-time)

1. **Sign up/Login to Vercel**
   - Go to https://vercel.com
   - Sign up with GitHub (easiest if your code is on GitHub)

2. **Import Your Project**
   - Click "Add New Project"
   - Select your repository
   - Vercel will auto-detect Next.js ✅

3. **Configure Environment Variables**
   - Before deploying, click "Environment Variables"
   - Add these two variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```
   - Get these from: Supabase Dashboard → Settings → API

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - Your site will be live at `your-project.vercel.app`

### Option B: Via Vercel CLI (Faster for updates)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts:
# - Link to existing project or create new
# - Add environment variables when prompted
```

## Step 3: Connect Your Domain (loz.watch)

1. **In Vercel Dashboard:**
   - Go to your project → Settings → Domains
   - Add `loz.watch`
   - Add `www.loz.watch` (optional but recommended)

2. **Configure DNS:**
   Vercel will show you DNS instructions. Typically:
   
   **Option 1 (Recommended):** Use CNAME record
   - Type: `CNAME`
   - Name: `@` (or leave blank for root domain)
   - Value: `cname.vercel-dns.com`
   
   **Option 2:** Use A records (if your DNS provider doesn't support CNAME on root)
   - Vercel will provide IP addresses in the dashboard
   - Add A records pointing to those IPs

3. **Wait for DNS Propagation**
   - Usually 5-60 minutes
   - Can take up to 48 hours in rare cases
   - Vercel will automatically provision SSL certificate ✅

## Step 4: Verify Everything Works

After deployment, test:

- [ ] Site loads at `https://loz.watch`
- [ ] Map displays locations
- [ ] Status bar shows data
- [ ] No console errors (check browser DevTools)
- [ ] Mobile experience works
- [ ] SSL certificate is active (green lock icon)

## Quick Troubleshooting

**Build fails?**
- Check that Supabase env vars are set correctly
- Verify Node.js version (Vercel uses 18+ by default)

**Domain not working?**
- Wait for DNS propagation (can take up to 48 hours)
- Verify DNS records match Vercel's instructions
- Check domain status in Vercel dashboard

**Map not loading?**
- Verify Supabase environment variables are set
- Check browser console for errors
- Ensure Supabase RLS policies allow public read access

## What You Need Before Deploying

✅ **Code pushed to GitHub/GitLab/Bitbucket**  
✅ **Vercel account** (free tier is fine)  
✅ **Supabase project set up** (see `SUPABASE_SETUP.md`)  
✅ **Domain (loz.watch) DNS access** (to configure DNS records)

## Cost Estimate

- **Vercel:** Free tier includes:
  - Unlimited personal projects
  - 100GB bandwidth/month
  - Automatic SSL
  - Perfect for loz.watch! ✅

- **Supabase:** Free tier includes:
  - 500MB database
  - 2GB bandwidth
  - Should be plenty for your use case ✅

## Next Steps After Deployment

1. Test all features on production
2. Monitor Vercel dashboard for any errors
3. Set up monitoring/alerts if needed
4. Share your site! 🎉

---

**Need help?** Check the detailed guides:
- Full deployment: `DEPLOYMENT.md`
- Supabase setup: `SUPABASE_SETUP.md`
- Production readiness: `PRODUCTION_READINESS.md`

